module.exports = {
     CreateSuccess(statusCode, successMessage, data, access_token){
        const successObj = {
            status : statusCode,
            message: successMessage,
            data: data,
            token: access_token
        };
        return successObj;
    }
}