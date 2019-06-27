const url = 'mongodb://localhost/grubbot';
const mongoist = require('mongoist');
const db = mongoist(url);

const functions = {
    getUser: async (slackUserId) => {
        const collection = db.collection('grubbot');
        const user = await collection.findOne({slackUserId});
        console.log('userfound', user)
        return user;
    },

    addUser: async (user) => {
        console.log('saving', user)
        const collection = db.collection('grubbot');
        const savedUser = await collection.insert(user);
        console.log('saved', savedUser)
        return savedUser;
    }
};

module.exports = functions;