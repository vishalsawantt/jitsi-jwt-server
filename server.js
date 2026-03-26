const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Your Jitsi private key
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCta+4o8U1ebv6G
1oawqQFTDMgTPrQn/64wBsJQM+fIw0QveuMeamb+mot+ZOInlrueaoqPsjfe3KDz
3xGFTSFlkTYu+oejkEma1iRvs2s7l6TAHT7cFW0Ua1bRc5xVZhGWdEQZr5ijQ1J/
uHZRka2uZ5ikytcRcWFdnhWoSCbUY65p6f8qthN0IMbtDI/XGtobqnNp6waeKQBS
2njqqXJG01T1RewkwslCyGA9EdrNtgP4onoWs1VZtbZnEvm1NBO1I3BT5YsqhHkE
YhM8dwIcJhkjo4u1ub7cL/bh2lSHnk5XqZ5RqTQ54FkQ1b1nI8j1b51f6xpKI2F9
ar/r1G6RAgMBAAECggEAdYV6s4wynhghrEacqAMfvqQewcvwUlrWM/2gmLFUFZ0e
C/7/ApGgklEwzsqW57UiF8yjcZWYfxKMkDdOrEMEqsupKFTmrlUNTDxqHLg9pviw
0PAAtSxf60KCZxYtj0HIEWlg7PcuPRVWRu8+XzCVvma97o73B/8JuGN00cFzbuGv
Vr1YWE9DSzH3dKywjS2+FBmM8bwisruTSYdUIYw7WAxjQvuqXqxE136ATNxgZu7D
gzEKJ2mG0cqOA8agmtyGoIUkUFNR0uCEKEyGTC5WpzOCOhUy3iD83Y7Xex8PDr5D
QEF1sp3HEBLXQEBO3cuo+vKA81K7Kb5wRmaV4ephcQKBgQDoOoe7W4Gd2+Q6KzMl
i+i2trLuU+TxHMfVndVwXHp31NKtKKd4iwpV9nfnL02ADGdpE5x0AEb7yNIEhVfA
PYbz8GWNaWoH5b8OuqS39/AvoXsRjtyZGrfqeb34kJSOc3022qu376iL9A6C5XMi
nOjALEmqq8MfcOeBpnHDcmn8LwKBgQC/LGHsnznVeU9fOlIEt7YM+PiHQerxkPnW
Z6wGRImzqMOa3jet8Z75sp8NPmPU0muG/D0TY4bx0G0XdOwmHT2opqF/pdgqcOlX
4k2EEv81aDuz98lXEWehny29PWIHY2QbQUsm8QbxMNmcUzrcGQwe579kUTic0fBO
NTxJmLPRPwKBgFPkSQJC5UkclY756iknKLNQvsTf47XCeuJNeTx0+/zsEgthw1YF
jH9PYTNP4ERgtr67yeoR65Krkkr1zKRy1Zyr/FOggCBIO8PbYwPeepMKV8YZANIC
V+xJfHod6LypNdOqHRx+ZDniuZdJwlT/sAk0NoyELiHejJNGiJRdcbIbAoGBALtX
I/M8qfEvev+n6D4lRar6xJnPmAv39U0NtT9DJOpBZMY8I7Y6xH6Pc1wIGs6xEZxr
TPLWIqSPiohlFRHYr9a4zCSKAga9NX3hD/NwplXQ+kjHdq/zJ2nz0l/TamAxHyWy
W5IiupnbNDUEPvb3OLCEjEMjcOYEuYf6lUTN9tEDAoGBAJ1Od1x6QvzeeRZq9aG0
DevuziwFFZVEa9PHLaBPI0ZkkLKZaJ4M8wTBhbpBk7Z7qTw5qbiToFK0nLcSs9WH
DxEC5kRjpeLNjZuRtI/jlAD3hd8ikSugJOJNTlx+0Lmqavd9QBuxm8L4DpXB5ZTo
gN+demRxOnH6LS98mKa0tDu1
-----END PRIVATE KEY-----`;

const APP_ID = "vpaas-magic-cookie-2fb727eb90064a9dab8d69dbae94d39c";
const KEY_ID = "vpaas-magic-cookie-2fb727eb90064a9dab8d69dbae94d39c/8ca958";
const SERVER_URL = "https://meet.jit.si";

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
    
    // Validate required parameters
    if (!roomName || !userId || !userName) {
      return res.status(400).json({ 
        error: 'Missing required parameters: roomName, userId, userName are required' 
      });
    }
    
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (24 * 60 * 60); // 24 hours
    
    // Sanitize room name
    const sanitizedRoom = `cosmino-${roomName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // JWT Payload
    const payload = {
      aud: 'jitsi',
      iss: APP_ID,
      sub: SERVER_URL,
      room: sanitizedRoom,
      exp: exp,
      nbf: now,
      context: {
        user: {
          id: userId,
          name: userName,
          email: userEmail || `${userName.toLowerCase().replace(/ /g, '.')}@cosmino.com`,
          moderator: isModerator || false,
        },
        features: {
          recording: false,
          livestreaming: false,
          'outbound-call': false,
        }
      }
    };
    
    // Generate JWT with RS256
    const token = jwt.sign(payload, PRIVATE_KEY, {
      algorithm: 'RS256',
      keyid: KEY_ID,
    });
    
    console.log(`✅ Token generated for room: ${roomName} at ${new Date().toISOString()}`);
    console.log(`   User: ${userName}, Moderator: ${isModerator}`);
    
    res.json({ 
      success: true, 
      token: token,
      room: sanitizedRoom,
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
});