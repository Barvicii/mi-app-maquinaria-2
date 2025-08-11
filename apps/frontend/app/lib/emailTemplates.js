// URL del logo de Orchard Services desde Google Drive
const ORCHARD_LOGO_URL = 'https://drive.google.com/uc?export=view&id=1CO7ttKjrIQ9-ojlwoyijtHRl1K0jl4Wb';

// Template para contraseña temporal
export const temporaryPasswordTemplate = (name, temporaryPassword, loginUrl = 'https://orchardservices.co.nz/login') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Temporary Password - Orchard Services</title>
    <style>
        /* General styles and for email clients that support them */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Styles for dark mode on compatible clients */
        @media (prefers-color-scheme: dark) {
            .background-dark { background-color: #333333 !important; }
            .text-dark { color: #dddddd !important; }
            .card-dark { background-color: #444444 !important; }
            .button-dark { background-color: #2EAD6A !important; }
            .password-box-dark { background-color: #555555 !important; }
        }
    </style>
</head>
<body style="background-color: #f8f9fa; margin: 0 !important; padding: 40px 0 !important;">
    <!-- Main email container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="background-color: #f8f9fa;" class="background-dark">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <!-- Logo Row -->
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 20px 30px 20px; background-color: #ffffff; border-top-left-radius: 12px; border-top-right-radius: 12px;" class="card-dark">
                            <a href="https://orchardservices.co.nz/" target="_blank">
                                <img src="${ORCHARD_LOGO_URL}" alt="Orchard Services Logo" width="150" style="display: block; width: 150px; max-width: 100%; min-width: 100px; font-family: 'Arial', sans-serif; color: #333333; font-size: 18px;" border="0">
                            </a>
                        </td>
                    </tr>
                    <!-- Main Title Row -->
                    <tr>
                        <td align="center" style="padding: 0 30px 20px 30px; background-color: #ffffff;" class="card-dark">
                            <h1 style="font-family: 'Arial', sans-serif; font-size: 28px; font-weight: bold; color: #004d40; margin: 0;" class="text-dark">
                                Your Temporary Password
                            </h1>
                        </td>
                    </tr>
                    <!-- Instruction Text Row -->
                    <tr>
                        <td align="left" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0;" class="text-dark">
                                Hello ${name || 'there'}!
                                <br><br>
                                Here is your temporary password to access <strong>Orchard Services</strong>. For your security, we recommend changing it to a new one immediately after logging in.
                            </p>
                        </td>
                    </tr>
                    <!-- Temporary Password Row -->
                    <tr>
                        <td align="center" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                             <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="background-color: #edf2f7; border-radius: 8px; padding: 15px 20px;" class="password-box-dark">
                                        <p style="font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: bold; color: #004d40; margin: 0; letter-spacing: 2px;" class="text-dark">
                                            ${temporaryPassword}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Login Button Row (CTA) -->
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px; background-color: #ffffff;" class="card-dark">
                            <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #2EAD6A;" class="button-dark">
                                        <a href="${loginUrl}" target="_blank" style="font-size: 18px; font-family: 'Arial', sans-serif; color: #ffffff; text-decoration: none; display: inline-block; padding: 16px 36px; border-radius: 8px; border: 1px solid #2EAD6A; font-weight: bold;">
                                            Log In
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Security and Footer Row -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #ffffff; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 12px; line-height: 18px; color: #888888; margin: 0;" class="text-dark">
                                If you did not request a new password, you can safely ignore this email.
                                <br><br>
                                <strong>Need help?</strong> Contact our support team at <a href="mailto:no-reply@orchardservices.co.nz" style="color: #2EAD6A; text-decoration: none;">no-reply@orchardservices.co.nz</a>
                                <br>or visit our <a href="https://orchardservices.co.nz/" style="color: #2EAD6A; text-decoration: none;">home page</a>
                                <br><br>
                                © 2025 Orchard Services. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Template para restablecer contraseña
export const resetPasswordTemplate = (resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Password - Orchard Services</title>
    <style>
        /* General styles and for email clients that support them */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Styles for dark mode on compatible clients */
        @media (prefers-color-scheme: dark) {
            .background-dark { background-color: #333333 !important; }
            .text-dark { color: #dddddd !important; }
            .card-dark { background-color: #444444 !important; }
            .button-dark { background-color: #2EAD6A !important; }
        }
    </style>
</head>
<body style="background-color: #f8f9fa; margin: 0 !important; padding: 40px 0 !important;">
    <!-- Main email container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="background-color: #f8f9fa;" class="background-dark">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <!-- Logo Row -->
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 20px 30px 20px; background-color: #ffffff; border-top-left-radius: 12px; border-top-right-radius: 12px;" class="card-dark">
                            <a href="https://orchardservices.co.nz/" target="_blank">
                                <img src="${ORCHARD_LOGO_URL}" alt="Orchard Services Logo" width="150" style="display: block; width: 150px; max-width: 100%; min-width: 100px; font-family: 'Arial', sans-serif; color: #333333; font-size: 18px;" border="0">
                            </a>
                        </td>
                    </tr>
                    <!-- Main Title Row -->
                    <tr>
                        <td align="center" style="padding: 0 30px 20px 30px; background-color: #ffffff;" class="card-dark">
                            <h1 style="font-family: 'Arial', sans-serif; font-size: 28px; font-weight: bold; color: #004d40; margin: 0;" class="text-dark">
                                Reset Your Password
                            </h1>
                        </td>
                    </tr>
                    <!-- Instruction Text Row -->
                    <tr>
                        <td align="left" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0;" class="text-dark">
                                Hello!
                                <br><br>
                                We received a request to reset the password for your <strong>Orchard Services</strong> account. Click the button below to choose a new password.
                            </p>
                        </td>
                    </tr>
                    <!-- Reset Button Row (CTA) -->
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px; background-color: #ffffff;" class="card-dark">
                            <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #2EAD6A;" class="button-dark">
                                        <a href="${resetUrl}" target="_blank" style="font-size: 18px; font-family: 'Arial', sans-serif; color: #ffffff; text-decoration: none; display: inline-block; padding: 16px 36px; border-radius: 8px; border: 1px solid #2EAD6A; font-weight: bold;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                     <!-- Alternative link row -->
                    <tr>
                        <td align="left" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 14px; line-height: 20px; color: #888888; margin: 0;" class="text-dark">
                                If the button doesn't work, copy and paste the following link into your browser:
                                <br>
                                <a href="${resetUrl}" target="_blank" style="color: #2EAD6A; text-decoration: underline;">${resetUrl}</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Security and footer row -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #ffffff; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 12px; line-height: 18px; color: #888888; margin: 0;" class="text-dark">
                                If you did not request a password reset, you can safely ignore this email.
                                <br><br>
                                <strong>Need help?</strong> Contact our support team at <a href="mailto:no-reply@orchardservices.co.nz" style="color: #2EAD6A; text-decoration: none;">no-reply@orchardservices.co.nz</a>
                                <br>or visit our <a href="https://orchardservices.co.nz/" style="color: #2EAD6A; text-decoration: none;">home page</a>
                                <br><br>
                                © 2025 Orchard Services. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Template para código de verificación (registro)
export const verificationCodeTemplate = (verificationCode) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email Verification - Orchard Services</title>
    <style>
        /* General styles and for email clients that support them */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Styles for dark mode on compatible clients */
        @media (prefers-color-scheme: dark) {
            .background-dark { background-color: #333333 !important; }
            .text-dark { color: #dddddd !important; }
            .card-dark { background-color: #444444 !important; }
            .code-box-dark { background-color: #555555 !important; }
        }
    </style>
</head>
<body style="background-color: #f8f9fa; margin: 0 !important; padding: 40px 0 !important;">
    <!-- Main email container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="background-color: #f8f9fa;" class="background-dark">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <!-- Logo Row -->
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 20px 30px 20px; background-color: #ffffff; border-top-left-radius: 12px; border-top-right-radius: 12px;" class="card-dark">
                            <a href="https://orchardservices.co.nz/" target="_blank">
                                <img src="${ORCHARD_LOGO_URL}" alt="Orchard Services Logo" width="150" style="display: block; width: 150px; max-width: 100%; min-width: 100px; font-family: 'Arial', sans-serif; color: #333333; font-size: 18px;" border="0">
                            </a>
                        </td>
                    </tr>
                    <!-- Main Title Row -->
                    <tr>
                        <td align="center" style="padding: 0 30px 20px 30px; background-color: #ffffff;" class="card-dark">
                            <h1 style="font-family: 'Arial', sans-serif; font-size: 28px; font-weight: bold; color: #004d40; margin: 0;" class="text-dark">
                                Email Verification
                            </h1>
                        </td>
                    </tr>
                    <!-- Instruction Text Row -->
                    <tr>
                        <td align="left" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0;" class="text-dark">
                                Your email verification code is:
                            </p>
                        </td>
                    </tr>
                    <!-- Verification Code Row -->
                    <tr>
                        <td align="center" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                            <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="background-color: #edf2f7; border-radius: 8px; padding: 20px;" class="code-box-dark">
                                        <p style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: bold; color: #004d40; margin: 0; letter-spacing: 3px;" class="text-dark">
                                            ${verificationCode}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Instruction Text Row -->
                    <tr>
                        <td align="left" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0;" class="text-dark">
                                Enter this code to complete your registration with <strong>Orchard Services</strong>.
                            </p>
                        </td>
                    </tr>
                    <!-- Security and Footer Row -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #ffffff; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 12px; line-height: 18px; color: #888888; margin: 0;" class="text-dark">
                                If you did not request this verification code, you can safely ignore this email.
                                <br><br>
                                <strong>Need help?</strong> Contact our support team at <a href="mailto:no-reply@orchardservices.co.nz" style="color: #2EAD6A; text-decoration: none;">no-reply@orchardservices.co.nz</a>
                                <br>or visit our <a href="https://orchardservices.co.nz/" style="color: #2EAD6A; text-decoration: none;">home page</a>
                                <br><br>
                                © 2025 Orchard Services. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// Template para invitación de usuario
export const userInvitationTemplate = (email, password, loginUrl = 'https://orchardservices.co.nz/login') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Invitation to Orchard Services</title>
    <style>
        /* General styles and for email clients that support them */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

        /* Styles for dark mode on compatible clients */
        @media (prefers-color-scheme: dark) {
            .background-dark { background-color: #333333 !important; }
            .text-dark { color: #dddddd !important; }
            .card-dark { background-color: #444444 !important; }
            .button-dark { background-color: #2EAD6A !important; }
            .credentials-box-dark { background-color: #555555 !important; }
        }
    </style>
</head>
<body style="background-color: #f8f9fa; margin: 0 !important; padding: 40px 0 !important;">
    <!-- Main email container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="background-color: #f8f9fa;" class="background-dark">
                <!--[if (gte mso 9)|(IE)]>
                <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
                <tr>
                <td align="center" valign="top" width="600">
                <![endif]-->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <!-- Logo Row -->
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 20px 30px 20px; background-color: #ffffff; border-top-left-radius: 12px; border-top-right-radius: 12px;" class="card-dark">
                            <a href="https://orchardservices.co.nz/" target="_blank">
                                <img src="${ORCHARD_LOGO_URL}" alt="Orchard Services Logo" width="150" style="display: block; width: 150px; max-width: 100%; min-width: 100px; font-family: 'Arial', sans-serif; color: #333333; font-size: 18px;" border="0">
                            </a>
                        </td>
                    </tr>
                    <!-- Main Title Row -->
                    <tr>
                        <td align="center" style="padding: 0 30px 20px 30px; background-color: #ffffff;" class="card-dark">
                            <h1 style="font-family: 'Arial', sans-serif; font-size: 28px; font-weight: bold; color: #004d40; margin: 0;" class="text-dark">
                                You've been invited!
                            </h1>
                        </td>
                    </tr>
                    <!-- Welcome Text Row -->
                    <tr>
                        <td align="left" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0;" class="text-dark">
                                Hello!
                                <br><br>
                                An account has been created for you at <strong>Orchard Services</strong>. Below you will find your credentials to log in. We recommend changing your password after your first login.
                            </p>
                        </td>
                    </tr>
                    <!-- Credentials Row -->
                    <tr>
                        <td align="center" style="padding: 0 30px 30px 30px; background-color: #ffffff;" class="card-dark">
                             <table border="0" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="left" style="background-color: #edf2f7; border-radius: 8px; padding: 20px;" class="credentials-box-dark">
                                        <p style="font-family: 'Arial', sans-serif; font-size: 16px; color: #555555; margin: 0 0 10px 0;" class="text-dark">
                                            <strong>Username:</strong>
                                            <span style="font-family: 'Courier New', Courier, monospace; color: #004d40;" class="text-dark">
                                                ${email}
                                            </span>
                                        </p>
                                        <p style="font-family: 'Arial', sans-serif; font-size: 16px; color: #555555; margin: 0;" class="text-dark">
                                            <strong>Temporary Password:</strong>
                                            <span style="font-family: 'Courier New', Courier, monospace; color: #004d40;" class="text-dark">
                                                ${password}
                                            </span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Login Button Row (CTA) -->
                    <tr>
                        <td align="center" style="padding: 0 30px 40px 30px; background-color: #ffffff;" class="card-dark">
                            <table border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td align="center" style="border-radius: 8px; background-color: #2EAD6A;" class="button-dark">
                                        <!-- The link should lead to your login page -->
                                        <a href="${loginUrl}" target="_blank" style="font-size: 18px; font-family: 'Arial', sans-serif; color: #ffffff; text-decoration: none; display: inline-block; padding: 16px 36px; border-radius: 8px; border: 1px solid #2EAD6A; font-weight: bold;">
                                            Login
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Security and Footer Row -->
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #ffffff; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;" class="card-dark">
                            <p style="font-family: 'Arial', sans-serif; font-size: 12px; line-height: 18px; color: #888888; margin: 0;" class="text-dark">
                                If you have received this email in error, please ignore it.
                                <br><br>
                                For support, contact us at <a href="mailto:no-reply@orchardservices.co.nz" style="color: #2EAD6A;">no-reply@orchardservices.co.nz</a>
                                <br><br>
                                © 2025 Orchard Services. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                <!--[if (gte mso 9)|(IE)]>
                </td>
                </tr>
                </table>
                <![endif]-->
            </td>
        </tr>
    </table>
</body>
</html>
`;

