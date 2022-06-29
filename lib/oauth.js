const axios = require('axios')

const TOKEN_API = 'http://open-api.pinduoduo.com/oauth/token'

module.exports = {
  getAccessToken: async (client_id, client_secret, code) => {
    const { data: response } = await axios.post(TOKEN_API, {
      client_id: client_id,
      code: code,
      grant_type: 'authorization_code',
      client_secret: client_secret,
    })

    if (typeof response['error_response'] !== 'undefined') {
      throw new Error(response['error_response']['error_msg'])
    }

    return response
  }
}
