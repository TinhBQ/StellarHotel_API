import { userModel } from '../models/index.js';
import Exception from '../exceptions/Exception.js';
import nodemailer from 'nodemailer';
import { OutputType, print } from '../helpers/print.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const register = async ({ email, password, phoneNumber }) => {
    let existingAccount = await userModel.findOne({ email });
    if (existingAccount) {
        throw new Exception(Exception.ACCOUNT_EXIST);
    }

    if (/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(password)) {
        // encrypted password, use bcrypt
        const hashPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        const newAccount = await userModel.create({
            email,
            password: hashPassword,
            phoneNumber,
        });

        if (!newAccount) {
            throw new Exception(Exception.CANNOT_REGISTER_ACCOUNT);
        }
    } else {
        throw new Exception(Exception.CANNOT_REGISTER_ACCOUNT);
    }
};

const login = async ({ email, password }) => {
    let existingAccount = await userModel.findOne({ email });
    if (!existingAccount) {
        throw new Exception(Exception.WRONG_EMAIL_OR_PASSWORD);
    }

    let isMatched = await bcrypt.compare(password, existingAccount.password);
    if (!isMatched) {
        throw new Exception(Exception.WRONG_EMAIL_OR_PASSWORD);
    }

    // Create a java web token
    let token = jwt.sign(
        {
            data: existingAccount,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '60 days',
        },
    );

    return {
        id: existingAccount._id,
        userName: existingAccount.userName,
        yearOfBirth: existingAccount.yearOfBirth,
        gender: existingAccount.gender,
        nationality: existingAccount.nationality,
        email,
        phoneNumber: existingAccount.phoneNumber,
        token: token,
    };
};

const sendOTP = async (email) => {
   
        const filterUser = await userModel.findOne({ email });
        if (!filterUser) {
            throw new Exception(Exception.INVALID_EMAIL);;
        }
        const otp = Math.floor(1000 + Math.random() * 9000);
        //send mail
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: 'nguyetque65697@gmail.com',
                pass: 'kfsxdgbvewakanjq',
            },
        });
        let mailOptions = {
            from: 'nguyetquepham7@gmail.com',
            to: email,
            subject: 'Xác thực người dùng',
            html: `<h1>Xác thực người dùng</h1>
                    <p>OTP xác thực người dùng của bạn là: ${otp},  có hiệu lực trong vòng 1 phút.</p>`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                print(error, OutputType.ERROR);
            } else {
                print('Email sent: ' + info.response, OutputType.INFORMATION);
            }
        });
        await userModel.findByIdAndUpdate(filterUser._id, {
            otp: otp,
        });
        return {
            otp: otp,
        };
  
};

const checkOTP = async (email, otp) => {
    const user = await userModel.findOne({ email });
    if (!user) {
        throw new Exception(Exception.INVALID_EMAIL);
    }

    if (user.otp == null) {
        throw new Exception('Yêu cầu người dùng send otp');
    }

    if (user.otp != otp) {
        throw new Exception('otp không hợp lệ');
    }

    await userModel.updateOne({ _id: user._id }, { $set: { otp: null } });
    return Exception.OTP_CORRECT;
};

const resetPassword = async (email, oldpass, newpass) => {
   
        const user = await userModel.findOne({ email });
        if (!user) {
            throw new Exception(Exception.INVALID_EMAIL);
        } else {
            let isMatched = await bcrypt.compare(oldpass, user.password);
            const hashPassword = await bcrypt.hash(newpass, parseInt(process.env.SALT_ROUNDS));
            if (!isMatched) {
                throw new Exception(Exception.INCORRECT_PASS);
            } else {
                if (/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(newpass)) {
                    await userModel.findByIdAndUpdate(user._id, { password: hashPassword });
                    return Exception.CHANGED_PASSWORD_SUCCESS;
                }
                throw new Exception(Exception.INVALID_PASSWORD);
            }
        }
   
};
const forgetPassword = async (email, newpass) => {
   
        const user = await userModel.findOne({ email });
        if (!user) {
            throw new Exception(Exception.INVALID_EMAIL);
        } else {
         if (/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/.test(newpass)) {
            const hashPassword = await bcrypt.hash(newpass, parseInt(process.env.SALT_ROUNDS));
            await userModel.findByIdAndUpdate(user._id, { password: hashPassword });
            return Exception.CHANGED_PASSWORD_SUCCESS;
        } else {
            throw new Exception(Exception.INVALID_PASSWORD);
        }
    }
    
};

export default { register, login, sendOTP, checkOTP, resetPassword, forgetPassword };
