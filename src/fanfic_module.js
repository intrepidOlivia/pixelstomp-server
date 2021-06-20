
const WebSocket = require('ws');
const fs = require('fs');
var httpProxy = require('http-proxy');
const { IncomingMessage } = require('http');

const PORT = process.env.WSPORT || 8081;

let fullText = '';
const sockets = {};
const viewers = {};
let clientCount = 0;
let sectionIndex = 0;
let RATE_LIMIT = 500;
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

        if (message.viewer) {
            // TODO: Send only the index of the current text
            registerViewer(sockets[clientId]);
            feedToViewers();
            return;
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
        if (message.changeIndex !== undefined && Date.now() - rateTimer >= RATE_LIMIT) {
            sectionIndex = message.changeIndex;
            if (sectionIndex < 0) {
                sectionIndex = 0;
            }
            rateTimer = Date.now();
        }

        feedToReaders();
        feedToViewers();
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

function registerViewer(socketClient) {
    socketClient.isViewer = true;
}

function feedToReaders() {
    Object.values(sockets).forEach(s => {
        if (!s.isViewer) {
            s.socket.send(JSON.stringify({
                text: fullText,
                index: sectionIndex,
                allClients: Object.values(sockets).filter(client => !client.isViewer).map(client => client.name)
            }));
        }
    });
}

function feedToViewers() {
    Object.values(sockets).forEach(s => {
        if (s.isViewer) {
            s.socket.send(JSON.stringify({
                text: fullText,
                index: sectionIndex,
            }));
        }
    });
}

// FOR REFERENCE ONLY
const messageStructure = {
    alert: 'string',
    text: 'string',
    index: 'number',
    allClients: 'Array<string>',
    viewer: 'boolean',
};

class SocketClient {
    constructor(socket, id) {
        this.socket = socket;
        this.id = id;
        this.name = null;
        this.isViewer = false;
    }
}

function resetFanfic() {
    sectionIndex = 0;
    // TODO: Reset loaded fanfic
}

/**
 * 
 * @param {IncomingMessage} request 
 * @param {OutgoingMessage} response
 */
function loadNewFanfic(request, response) {
    
    let bodyString = '';
    request.on('data', chunk => {
        bodyString += chunk;
    });
    request.on('end', () => {
        let body;
        try {
            body = JSON.parse(bodyString);
            // const fanficUrl = `http://fanfiction.net/s/${urlInfo.id}/${urlInfo.chapter}`
            const fanficText = body.text;
            fullText = fanficText;
            response.statusCode = 200;
            response.write('Successfully updated fic');
            response.end();
            sectionIndex = 0;
            feedToReaders();
            feedToViewers();
            return;
        } catch (e) {
            response.statusCode = 400;
            console.log('ERROR:', e);
            response.write('Unable to process request: ' + e);
            response.end();
            return;
        }
    });
}

module.exports = {
    server,
    PORT,
    proxy: wsProxy,
    api: {
        loadNewFanfic,
    },
};