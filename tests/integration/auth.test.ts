import moment from 'moment';
import request from 'supertest';
import httpStatus from 'http-status';
import httpMocks from 'node-mocks-http';
import { app } from '@/app';
import { ApiError } from '@/utils/api';
import { User, AuthToken } from '@/models';
import { Roles } from '@/config/roles';
import { Config } from '@/config/config';
import { auth } from '@/middlewares/auth';
import setupTestDB from '../utils/setupTestDB';
import { AuthTokenTypes } from '@/config/authTokenTypes';
import { userOne, admin, insertUsers } from '../fixtures/user.fixture';
import { AuthTokenService, EmailService, AuthService } from '@/services';
import { userOneAccessToken, adminAccessToken } from '../fixtures/token.fixture';

setupTestDB();

describe('Auth routes', () => {
  // describe('POST /v1/auth/register', () => {
  //   let newUser;
  //   beforeEach(() => {
  //     newUser = {
  //       name: faker.name.findName(),
  //       email: faker.internet.email().toLowerCase(),
  //       password: 'password1',
  //     };
  //   });

  //   test('should return 201 and successfully register user if request data is ok', async () => {
  //     const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);
  //     expect(res.body.data.user).not.toHaveProperty('password');
  //     expect(res.body.data.user).toEqual({
  //       id: expect.anything(),
  //       name: newUser.name,
  //       email: newUser.email,
  //       imageUrl: 'https://api.lorem.space/image/face?hash=92310',
  //       role: 'user',
  //       isEmailVerified: false,
  //     });

  //     const dbUser = await User.findById(res.body.data.user.id);
  //     expect(dbUser).toBeDefined();
  //     expect(dbUser.password).not.toBe(newUser.password);
  //     expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: 'user', isEmailVerified: false });

  //     expect(res.body.data.tokens).toEqual({
  //       access: { token: expect.anything(), expires: expect.anything() },
  //       refresh: { token: expect.anything(), expires: expect.anything() },
  //     });
  //   });

  //   test('should return 400 error if email is invalid', async () => {
  //     newUser.email = 'invalidEmail';

  //     await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
  //   });

  //   test('should return 400 error if email is already used', async () => {
  //     await insertUsers([userOne]);
  //     newUser.email = userOne.email;

  //     await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
  //   });

  //   test('should return 400 error if password length is less than 8 characters', async () => {
  //     newUser.password = 'passwo1';

  //     await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
  //   });

  //   test('should return 400 error if password does not contain both letters and numbers', async () => {
  //     newUser.password = 'password';

  //     await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

  //     newUser.password = '11111111';

  //     await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
  //   });
  // });

  describe.skip('POST /v1/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
        gCaptcha: '6Lfp7cQcAAAAAMSE8TaqPgZDfO8sHU7ge6vJU2AA'
      };
      
      jest.spyOn(AuthService, 'verifyCaptcha').mockResolvedValue();
      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.OK);

      expect(res.body.data.user).toEqual({
        id: expect.anything(),
        name: userOne.name,
        email: userOne.email,
        role: userOne.role,
        imageUrl: 'https://api.lorem.space/image/face?hash=92310',
        isEmailVerified: userOne.isEmailVerified,
        gameId: userOne.gameId.toHexString(),
      });

      expect(res.body.data.tokens).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
      });
    });

    test('should return 401 error if there are no users with that email', async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
        gCaptcha: '6Lfp7cQcAAAAAMSE8TaqPgZDfO8sHU7ge6vJU2AA'
      };
      
      jest.spyOn(AuthService, 'verifyCaptcha').mockResolvedValue();
      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ status: 'ERROR', error: 'Incorrect email or password', data: {}, meta: {} });
    });

    test('should return 401 error if password is wrong', async () => {
      jest.spyOn(AuthService, 'verifyCaptcha').mockResolvedValue();

      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword1',
        gCaptcha: '6Lfp7cQcAAAAAMSE8TaqPgZDfO8sHU7ge6vJU2AA'
      };

      const res = await request(app).post('/v1/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ status: 'ERROR', error: 'Incorrect email or password', data: {}, meta: {}  });
    });
  });

  describe('POST /v1/auth/logout', () => {
    // test('should return 204 if refresh token is valid', async () => {
    //   await insertUsers([userOne]);
    //   const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
    //   const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);
    //   await AuthTokenService.saveToken(refreshToken, userOne._id, expires, AuthTokenTypes.REFRESH);

    //   await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

    //   const dbRefreshTokenDoc = await AuthToken.findOne({ token: refreshToken });
    //   expect(dbRefreshTokenDoc).toBe(null);
    // });

    // test('should return 400 error if refresh token is missing from request body', async () => {
    //   await request(app).post('/v1/auth/logout').send().expect(httpStatus.BAD_REQUEST);
    // });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
      const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
      const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);
      await AuthTokenService.saveToken(refreshToken, userOne._id, expires, AuthTokenTypes.REFRESH, true);

      await request(app).post('/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });
  });

  // describe('POST /v1/auth/refresh-tokens', () => {
  //   test('should return 200 and new auth tokens if refresh token is valid', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
  //     const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);
  //     await AuthTokenService.saveToken(refreshToken, userOne._id, expires, AuthTokenTypes.REFRESH);

  //     const res = await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.OK);

  //     expect(res.body.data.tokens).toEqual({
  //       access: { token: expect.anything(), expires: expect.anything() },
  //       refresh: { token: expect.anything(), expires: expect.anything() },
  //     });

  //     const token = await AuthTokenService.getToken(userOne._id);
  //     expect(token).toMatchObject({ type: AuthTokenTypes.REFRESH, user: userOne._id, blacklisted: false });

  //     const dbRefreshTokenCount = await AuthToken.countDocuments();
  //     expect(dbRefreshTokenCount).toBe(1);
  //   });

  //   test('should return 400 error if refresh token is missing from request body', async () => {
  //     await request(app).post('/v1/auth/refresh-tokens').send().expect(httpStatus.BAD_REQUEST);
  //   });

  //   test('should return 401 error if refresh token is signed using an invalid secret', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
  //     const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH, 'invalidSecret');
  //     await AuthTokenService.saveToken(refreshToken, userOne._id, expires, AuthTokenTypes.REFRESH);

  //     await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
  //   });

  //   test('should return 401 error if refresh token is not found in the database', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
  //     const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);

  //     await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
  //   });

  //   test('should return 401 error if refresh token is blacklisted', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
  //     const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);
  //     await AuthTokenService.saveToken(refreshToken, userOne._id, expires, AuthTokenTypes.REFRESH, true);

  //     await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
  //   });

  //   test('should return 401 error if refresh token is expired', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().subtract(1, 'minutes');
  //     const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);
  //     await AuthTokenService.saveToken(refreshToken, userOne._id, expires, AuthTokenTypes.REFRESH);

  //     await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
  //   });

  //   test('should return 401 error if user is not found', async () => {
  //     const expires = moment().add(Config.jwt.refreshExpirationDays, 'days');
  //     const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);
  //     await AuthTokenService.saveToken(refreshToken, userOne._id, expires, AuthTokenTypes.REFRESH);

  //     await request(app).post('/v1/auth/refresh-tokens').send({ refreshToken }).expect(httpStatus.UNAUTHORIZED);
  //   });
  // });

  describe('POST /v1/auth/forgot-password', () => {
    beforeEach(() => {
      jest.spyOn(EmailService.mailchimpInstance.messages, 'send').mockResolvedValue(null);
    });

    // test('should return 204 and send reset password email to the user', async () => {
    //   await insertUsers([userOne]);
    //   const sendResetPasswordEmailSpy = jest.spyOn(EmailService, 'sendResetPasswordEmail');

    //   await request(app).post('/v1/auth/forgot-password').send({ email: userOne.email }).expect(httpStatus.NO_CONTENT);

    //   expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
    //   const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
    //   const dbResetPasswordTokenDoc = await AuthToken.findOne({ token: resetPasswordToken, user: userOne._id.toString() });
    //   expect(dbResetPasswordTokenDoc).toBeDefined();
    // });

    // test('should return 400 if email is missing', async () => {
    //   await insertUsers([userOne]);

    //   await request(app).post('/v1/auth/forgot-password').send().expect(httpStatus.BAD_REQUEST);
    // });

    test('should return 404 if email does not belong to any user', async () => {
      await request(app).post('/v1/auth/forgot-password').send({ email: userOne.email }).expect(httpStatus.NOT_FOUND);
    });
  });

  // describe('POST /v1/auth/reset-password', () => {
  //   test('should return 204 and reset the password', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(Config.jwt.resetPasswordExpirationMinutes, 'minutes');
  //     const resetPasswordToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);
  //     await AuthTokenService.saveToken(resetPasswordToken, userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);

  //     await request(app)
  //       .post('/v1/auth/reset-password')
  //       .query({ token: resetPasswordToken })
  //       .send({ password: 'password2' })
  //       .expect(httpStatus.NO_CONTENT);

  //     const dbUser = await User.findById(userOne._id);
  //     const isPasswordMatch = await bcrypt.compare('password2', dbUser.password);
  //     expect(isPasswordMatch).toBe(true);

  //     const dbResetPasswordTokenCount = await AuthToken.countDocuments({
  //       user: userOne._id.toString(),
  //       type: AuthTokenTypes.RESET_PASSWORD,
  //     });
  //     expect(dbResetPasswordTokenCount).toBe(0);
  //   });

  //   test('should return 400 if reset password token is missing', async () => {
  //     await insertUsers([userOne]);

  //     await request(app).post('/v1/auth/reset-password').send({ password: 'password2' }).expect(httpStatus.BAD_REQUEST);
  //   });

  //   test('should return 401 if reset password token is blacklisted', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(Config.jwt.resetPasswordExpirationMinutes, 'minutes');
  //     const resetPasswordToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);
  //     await AuthTokenService.saveToken(resetPasswordToken, userOne._id, expires, AuthTokenTypes.RESET_PASSWORD, true);

  //     await request(app)
  //       .post('/v1/auth/reset-password')
  //       .query({ token: resetPasswordToken })
  //       .send({ password: 'password2' })
  //       .expect(httpStatus.UNAUTHORIZED);
  //   });

  //   test('should return 401 if reset password token is expired', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().subtract(1, 'minutes');
  //     const resetPasswordToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);
  //     await AuthTokenService.saveToken(resetPasswordToken, userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);

  //     await request(app)
  //       .post('/v1/auth/reset-password')
  //       .query({ token: resetPasswordToken })
  //       .send({ password: 'password2' })
  //       .expect(httpStatus.UNAUTHORIZED);
  //   });

  //   test('should return 401 if user is not found', async () => {
  //     const expires = moment().add(Config.jwt.resetPasswordExpirationMinutes, 'minutes');
  //     const resetPasswordToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);
  //     await AuthTokenService.saveToken(resetPasswordToken, userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);

  //     await request(app)
  //       .post('/v1/auth/reset-password')
  //       .query({ token: resetPasswordToken })
  //       .send({ password: 'password2' })
  //       .expect(httpStatus.UNAUTHORIZED);
  //   });

  //   test('should return 400 if password is missing or invalid', async () => {
  //     await insertUsers([userOne]);
  //     const expires = moment().add(Config.jwt.resetPasswordExpirationMinutes, 'minutes');
  //     const resetPasswordToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);
  //     await AuthTokenService.saveToken(resetPasswordToken, userOne._id, expires, AuthTokenTypes.RESET_PASSWORD);

  //     await request(app).post('/v1/auth/reset-password').query({ token: resetPasswordToken }).expect(httpStatus.BAD_REQUEST);

  //     await request(app)
  //       .post('/v1/auth/reset-password')
  //       .query({ token: resetPasswordToken })
  //       .send({ password: 'short1' })
  //       .expect(httpStatus.BAD_REQUEST);

  //     await request(app)
  //       .post('/v1/auth/reset-password')
  //       .query({ token: resetPasswordToken })
  //       .send({ password: 'password' })
  //       .expect(httpStatus.BAD_REQUEST);

  //     await request(app)
  //       .post('/v1/auth/reset-password')
  //       .query({ token: resetPasswordToken })
  //       .send({ password: '11111111' })
  //       .expect(httpStatus.BAD_REQUEST);
  //   });
  // });

  // describe('POST /v1/auth/send-verification-email', () => {
  //   beforeEach(() => {
  //     jest.spyOn(EmailService.transport, 'sendMail').mockResolvedValue(null);
  //   });

  //   test('should return 204 and send verification email to the user', async () => {
  //     await insertUsers([userOne]);
  //     const sendVerificationEmailSpy = jest.spyOn(EmailService, 'sendVerificationEmail');

  //     await request(app)
  //       .post('/v1/auth/send-verification-email')
  //       .set('Authorization', `Bearer ${userOneAccessToken}`)
  //       .expect(httpStatus.NO_CONTENT);

  //     expect(sendVerificationEmailSpy).toHaveBeenCalledWith(userOne.email, expect.any(String));
  //     const verifyEmailToken = sendVerificationEmailSpy.mock.calls[0][1];
  //     const dbVerifyEmailToken = await AuthToken.findOne({ token: verifyEmailToken, user: userOne._id.toString() });

  //     expect(dbVerifyEmailToken).toBeDefined();
  //   });

  //   test('should return 401 error if access token is missing', async () => {
  //     await insertUsers([userOne]);

  //     await request(app).post('/v1/auth/send-verification-email').send().expect(httpStatus.UNAUTHORIZED);
  //   });
  // });

  describe('POST /v1/auth/verify-email', () => {
    test('should return 204 and verify the email', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(Config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL);
      await AuthTokenService.saveToken(verifyEmailToken, userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL);

      await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);

      expect(dbUser.isEmailVerified).toBe(true);

      const dbVerifyEmailToken = await AuthToken.countDocuments({
        user: userOne._id.toString(),
        type: AuthTokenTypes.VERIFY_EMAIL,
      });
      expect(dbVerifyEmailToken).toBe(0);
    });

    test('should return 400 if verify email token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v1/auth/verify-email').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 if verify email token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(Config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL);
      await AuthTokenService.saveToken(verifyEmailToken, userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL, true);

      await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if verify email token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const verifyEmailToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL);
      await AuthTokenService.saveToken(verifyEmailToken, userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL);

      await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(Config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL);
      await AuthTokenService.saveToken(verifyEmailToken, userOne._id, expires, AuthTokenTypes.VERIFY_EMAIL);

      await request(app)
        .post('/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});

describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user._id).toEqual(userOne._id);
  });

  test.skip('should call next with unauthorized error if access token is not found in header', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(Config.jwt.accessExpirationMinutes, 'minutes');
    const refreshToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.REFRESH);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(Config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.ACCESS, 'invalidSecret');
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await insertUsers([userOne]);
    const expires = moment().subtract(1, 'minutes');
    const accessToken = AuthTokenService.generateToken(userOne._id, expires, AuthTokenTypes.ACCESS);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' })
    );
  });

  test('should call next with forbidden error if user does not have required rights and userId is not in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth('anyRight')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: httpStatus.FORBIDDEN, message: 'Forbidden' }));
  });

  test('should call next with no errors if user does not have required rights but userId is in params', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userOneAccessToken}` },
      params: { userId: userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth('anyRight')(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with no errors if user has required rights', async () => {
    await insertUsers([admin]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      params: { userId: userOne._id.toHexString() },
    });
    const next = jest.fn();

    await auth(...Roles.roleRights.get('admin'))(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });
});
