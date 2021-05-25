
const WebSocket = require('ws');
const fs = require('fs');
var httpProxy = require('http-proxy');

const PORT = process.env.WSPORT || 8081;

let fullText = '';
const sockets = {};
let clientCount = 0;
let sectionIndex = 0;
let RATE_LIMIT = 1000;
let rateTimer = Date.now();

// DEBUG - READ SAMPLE TEXT
const readStream = fs.createReadStream('./public/fanfic_sample.txt', { encoding: 'utf8' });
readStream.on('data', chunk => {
    fullText += chunk;
});
readStream.on('end', () => {
    readStream.close();
});

// Upgrade proxy
const wsProxy = new httpProxy.createProxyServer({
	target: {
		host: 'localhost',
		port: PORT,
	},
});

// Server
const server = new WebSocket.Server({ port: PORT });
server.on('connection', function connect(socket) {
    const clientId = ++clientCount;
    console.log(`connection established with client ${clientId}`);
    sockets[clientId] = new SocketClient(socket, clientId);

    socket.on('message', function incoming(messageString) {
        const response = {};
        let message;

        // Parse message
        try {
            message = JSON.parse(messageString);
        } catch {
            throw new Error(`Unable to parse incoming message: ${messageString}`);
        }

        // find socket of sender
        const user = sockets[clientId];
        if (!user.name) {
            // Check for username in message
            if (message.username) {
                user.name = message.username;
            } else {
                response.alert = 'username',
                socket.send(JSON.stringify(response));
                return;
            }
        }

        // check for keyup or down event
        if (message.shiftIndex && Date.now() - rateTimer >= RATE_LIMIT) {
            sectionIndex += message.shiftIndex === 'up' ? -1 : 1;
            if (sectionIndex < 0) {
                sectionIndex = 0;
            }
            rateTimer = Date.now();
        }

        response.text = fullText;
        response.index = sectionIndex;
        response.allClients = Object.values(sockets).map(client => client.name);

        Object.values(sockets).forEach(s => {
            s.socket.send(JSON.stringify(response));
        });
    })

    socket.on('close', function () {
        delete sockets[clientId];
        const socketsRemaining = Object.keys(sockets).length;
        console.log(`Removing client ${clientId}. Number of sockets remaining:`, socketsRemaining);
        if (socketsRemaining < 1) {
            resetFanfic();
        }
    });
});

// FOR REFERENCE ONLY
const messageStructure = {
    alert: 'string',
    text: 'string',
    index: 'number',
    allClients: 'Array<string>',
};

class SocketClient {
    constructor(socket, id) {
        this.socket = socket;
        this.id = id;
        this.name = null;
    }
}

function resetFanfic() {
    sectionIndex = 0;
    // TODO: Reset loaded fanfic
}

module.exports = {
    server,
    PORT,
    proxy: wsProxy,
};