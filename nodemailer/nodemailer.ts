import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Use explicit TLS
    requireTLS: true, // Require TLS
    auth: {
        user: "84f0bb001@smtp-brevo.com", // Your SMTP login
        pass: "6OX7nUaIp1dbQxAv", // Your SMTP password
    },

});

export default transporter;