const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const { generateOTP } = require('../utils/otpGenerator.js')

dotenv.config();

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

module.exports.sendVerifyMail = async (name,email)=>{
    try
    {    
        const otp = generateOTP()+'';
        console.log('lets check otp type',  typeof otp);
        let message = `<p>Dear ${name},</p>
        <p>${otp} is your one time password (OTP). Please do not share the OTP with others.</p>
        <p>Regards,</p>
        <p>Team Braimy</p>`;
        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: emailUser,
                pass: emailPassword
            }
        });
        const mailOptions = {
            from: {
                name: 'Braimy',
                address: emailUser,
            },
            to: email,
            subject:'For Email Verification',
            html: message
            //html:`<p>Hi ${name}. Please click here to <a href="${baseUrl}verify_user?id=${user_id}">verify your email</a>. </p>`
        }
        transporter.sendMail(mailOptions,(error,info)=>{
            if(error)
            {
                console.log(error);
            }
            else
            {
                console.log("Email has been sent.",info.response);
            }
        })
        console.log(`check otp before return sendmail ${otp}`);
        return otp;
    }
    catch(err)
    {
        console.log(err.message);
    }
};