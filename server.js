const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ FIXED: Private key must have proper PEM headers and line breaks
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDyAFhzn4vqmF4y
RHO2qH2wt/abreA5LWmsOc9SkTZPhmDQQYOt93qYbbmLlQ4XFapM4X4kua/cFCAJ
QA9YrzJeodLgioelM1SiNHCdtZspLm8MDUiSweUFIQ1NmrRomaZieOaVJOeHFtwo
Ch3DNPpw2nVZxaGE9idZs1QpRqHhq3sdAASXpW61x8Q2RXDno7QgcRLuA35x+cQp
xRZZfaKoqvQio2Dlf33ZC3ywMYD7nqWHw9DTQ7hP3IgK3Dn0ErRbUKx3hl+jUPTL
LhYVO6oqqImDcADQxEZlM5AC1+uBxARteMmta1prDnKH+gXr+pAiOBzlse7NqT9t
OhLj2q8bAgMBAAECggEAcKhChQj4DK0D5OjC6XyEjrkFP7HxGQ0QDZIX9rsNCnZn
KWvmTh1QYBdschNgrNR0JDgxDg23VX+07jl5K3LbwvwYfFlhDkHYG27IIlMBuWkZ
XwXsDA3hfMLHO6JSbANjVqIrzbCRa+zzblxPQKmwEMtSKAl9yLUC2ppGCrUL9U6E
Q39QF7W+hXxuCq/Aa8JgT56sfFnFcfrcXpUGWPFJbiLzsAhUZ3HKD0kd2kKIayuL
I2Yu6sWDSVtfvl35L+FlYLs4H3yzTO449ehlWnQYiGHZLzAY2XM62LhoAcaP/0Ns
ydHkTVcgwkx2JrldyJCtIm92UFUNL7lzXPlvWcq2EQKBgQD+iTISWvopXk1R6Yv5
vgp5qf4bWAKUDizyp6rVWxcONhu7KDzw2ae2N733qGG/HxUHUlgs35jTbA5pBAnR
NViANMXiE4jxhh1orABUepEuRxULTxEdaqn7C9RvEhMxzyW7w+J8Vn6ObMFqTqr/
Z2pk5kVw+AQKHfp0VtlNbnq5IwKBgQDzZLFYSajcV/cj5L7PQ2tURfl/pTBm2upp
D+gVuu6YJPTjlVj7uWRB071LaBYVrEXmewVVylR96JuOb4kAFfJSASntLpdhh9zp
WkxqJ589ezkPDJQNmc6jjix/93fS9uI3d6FGxp82kD4+U8chJr1qXer+95gl4KfP
sMPdrESdqQKBgQCtPTl8LrmHAG0FrDwd3Y+JoP6XI76VgFRtT1rBXf8CKCeVqVxY
3Pr91VCRR+RHTWNlmVD0Mbb1Zt0j8qCv6Gv0znZEWeFh6VMI09Bhrw4y/iQ/jy/p
4pgQisuqURYJV6Cp/DehQsleLH0z2pkdvgg25lcq/VLag+7b0eSSg/g5GwKBgQDi
IaZnaaBaf9vc3FSvSms4k/63qmkq1q+9RwsQzWmJr6RaodJXpapRQoF3ws/p+PHE
rn2JdH9Fr8x+7H9ztfA6YlxqwcPh2JHVuJCQfBmFzKt5oO0ZKdKDwL71cZ1BQyFv
+VS85iLcVe2OiNXUpiKL5ZBErRMN9gjTfN6tYLUraQKBgHCRn9D5SPMXbmtX9Ml8
3E/1Gen1jjNS8MtIo8DAstjp1lE1xksCjTvOv7Nr5xZyP/Qgsui4Bs15Sr/nF/P3
oUYJ3GmH+Bgy9Ox4MCF2lE/Xrot8gt+cR2TMvGDZdViMB1R6iyPcQRV2OVicYmdo
C6m3xkHA7MjLG36UXMOS2hdJ
-----END PRIVATE KEY-----`;

const APP_ID = "vpaas-magic-cookie-2fb727eb90064a9dab8d69dbae94d39c";
const KEY_ID = "vpaas-magic-cookie-2fb727eb90064a9dab8d69dbae94d39c/a2cb83";
const SERVER_URL = "https://8x8.vc"; // ✅ FIXED: Use 8x8.vc not meet.jit.si for jaas

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'JWT Server is running!',
    timestamp: new Date().toISOString(),
    service: 'Jitsi JWT Generator'
  });
});

// Generate JWT token endpoint
app.post('/generate-token', (req, res) => {
  try {
    const { roomName, userId, userName, userEmail, isModerator } = req.body;

    if (!roomName || !userId || !userName) {
      return res.status(400).json({
        error: 'Missing required parameters: roomName, userId, userName are required'
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 60 * 60); // 24 hours

    // ✅ FIXED: For JaaS (8x8.vc), room format must be: APP_ID/roomName
    const sanitizedRoom = roomName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const fullRoom = `${APP_ID}/${sanitizedRoom}`;

    const payload = {
      aud: 'jitsi',                   // ✅ Must be 'jitsi'
      iss: 'chat',                    // ✅ FIXED: Must be 'chat' for JaaS, not APP_ID
      sub: APP_ID,                    // ✅ FIXED: sub must be APP_ID for JaaS
      room: '*',                      // ✅ FIXED: Use '*' to allow any room, or sanitizedRoom
      exp: exp,
      nbf: now,
      context: {
        user: {
          id: userId,
          name: userName,
          email: userEmail || `${userName.toLowerCase().replace(/ /g, '.')}@cosmino.com`,
          moderator: isModerator === true,
          'hidden-from-recorder': false,
        },
        features: {
          recording: false,
          livestreaming: false,
          'outbound-call': false,
          transcription: false,
        }
      }
    };

    // Sign with RS256
    const token = jwt.sign(payload, PRIVATE_KEY, {
      algorithm: 'RS256',
      keyid: KEY_ID,
      header: {
        alg: 'RS256',
        kid: KEY_ID,
        typ: 'JWT',
      }
    });

    console.log(`✅ Token generated for room: ${sanitizedRoom}`);
    console.log(`   Full room path: ${fullRoom}`);
    console.log(`   Key ID: ${KEY_ID}`);
    console.log(`   User: ${userName}, Moderator: ${isModerator}`);

    res.json({
      success: true,
      token: token,
      room: fullRoom,          // Return the full room path for Flutter to use
      sanitizedRoom: sanitizedRoom,
      expiresAt: new Date(exp * 1000).toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 JWT Server running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}`);
  console.log(`🔑 Token endpoint: POST http://localhost:${port}/generate-token`);
  console.log(`🔐 Key ID: ${KEY_ID}`);
});