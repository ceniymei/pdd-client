const axios =  require('axios')
const moment = require('moment')
const _ = require('underscore')
const md5 = require('nodejs-md5')

const API_URL = 'https://gw-api.pinduoduo.com/api/router'

class PddClient {
  constructor(client_id, client_secret, token = null) {
    this.client_id = client_id
    this.client_secret = client_secret
    this.token = token

    this.apiRequest = axios.create({
      baseURL: API_URL,
    })
  }

  /**
   * A more generic version for request.
   *
   * @param {array} params
   * @param {string} type
   */
  async genericRequest(params, type) {
    let response = await this.sendRequest(params, type)

    if (typeof response['error_response'] !== 'undefined') {
      throw new Error(response['error_response']['error_msg'])
    }
    let responseKey = type
      .split('.')
      .slice(1)
      .concat(['response'])
      .join('_')
    if (typeof response[responseKey] !== 'undefined') {
      return response[responseKey]
    }

    return response
  }

  /**
   * 发送请求
   *
   * @param {object} param 参数
   * @param {string} type 方法
   * @param {string} version 版本
   */
  async sendRequest(param, type, version = 'V1') {
    let query = await this.generateQuery(param, type, version)
    let { data: response } = await this.apiRequest.post('', query)

    return response
  }

  /**
   * 生成查询用请求参数
   *
   * @param {object} param 参数
   * @param {string} type 方法
   * @param {string} version 版本
   */
  async generateQuery(param, type, version) {
    let pub = {
      type: type, //API 接口名称
      client_id: this.client_id, //客户端ID
      // access_token: token, //通过code 获取的access token（无需授权的接口，该字段不参与sign签名运算）
      timestamp: moment().unix(), //unix 时间戳

      // data_type:   //返回数据类型，默认json
      //version: version // 协议版本号，默认v1
      //sign: 签名值 必须
    }

    if (this.token) {
      pub.access_token = this.token //通过code 获取的access token（无需授权的接口，该字段不参与sign签名运算）
    }

    let fullParams = Object.assign(pub, param)
    for (let key in fullParams) {
      if (typeof fullParams[key] === 'object') {
        fullParams[key] = JSON.stringify(fullParams[key])
      }
    }

    // 生成签名字段，并加入到参数列表
    let sign = await this.generateSign(fullParams)
    fullParams['sign'] = sign

    return fullParams
  }

  /**
   * 根据参数计算签名值
   *
   * @param {object} params
   */
  async generateSign(params) {
    // 1. 对参数列表按 key 首字母升序排序
    let keys = _.keys(params) // 获取key 列表
    let sortedKeys = _.sortBy(keys, (key) => key) // 对key进行排序

    // 2. 收尾添加 client secret， 把所有参数组合成一个字符串
    let sign = ''
    sign += this.client_secret // 首部添加client secret

    sortedKeys.forEach((key) => {
      sign += key + params[key]
    })

    sign += this.client_secret // 尾部添加 client secret

    return new Promise((resolve, reject) => {
      // 3. md5 生成签名
      md5.string.quiet(sign, (err, md5string) => {
        if (err) {
          return reject(err)
        }

        resolve(md5string.toUpperCase())
      })
    })
  }
}

module.exports = PddClient
