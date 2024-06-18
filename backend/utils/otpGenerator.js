const otpGenerator = require('otp-generator');

module.exports.generateOTP = ()=>{
    const OTP = otpGenerator.generate(6, { 
        upperCaseAlphabets: false, 
        specialChars: false,
        lowerCaseAlphabets: false 
    });

    return OTP;
}