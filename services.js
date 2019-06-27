const fetch = require('node-fetch');

const services = {
    authenticate: async(email, password) => {
        const params = {
            'brand': process.env.SERVICE_BRAND,
            'client_id': process.env.SERVICE_CLIENT_ID,
            'email': email,
            'password':  password};
    
        const response = await fetch('https://api-gtm.grubhub.com/auth', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });

        return await response.json();
    },

    getPastOrders: async (user) => {
        console.log('userA', user)
        const url = `https://api-gtm.grubhub.com/diners/${user.dinerId}/order-history/group/restaurant?facet=scheduled%3Afalse&facet=orderType%3AALL&sorts=default`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}`

            },
            method: 'GET',
            mode: 'cors'
        });
        
        return await response.json();
    },

    addToCart: async (user, orderId) => {
        const url = `https://api-gtm.grubhub.com/carts/${orderId}/recart`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}`

            },
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                "brand":"GRUBHUB",
                "experiments":["IGNORE_MINIMUM_TIP_REQUIREMENT","LINEOPTION_ENHANCEMENTS"],
                "recart_flags":["LINES","FULFILLMENT_INFO","COUPONS","TIP","CATERING_INFO"],
                "fail_out_on_validation_error":false
            })
        });
        console.log('response', response)
        return await response.json();
    }

}
/*
fetch("https://api-gtm.grubhub.com/carts/f87e7552-96cd-11e9-8bc1-5ba7e623db7f/recart", {"credentials":"include","headers":{"accept":"application/json","authorization":"Bearer 1cf64baf-4f54-4bd9-9af8-f233837b6d98","cache-control":"no-cache","content-type":"application/json;charset=UTF-8","if-modified-since":"0","perimeter-x":"eyJ1IjoiZWRjMTdjZjAtOTg1YS0xMWU5LThhMjctY2I3ZDg4NWU4NWI3IiwidiI6IjFlNDE3NzhkLTNhYWQtMTFlOS1iYTQxLTAyNDJhYzEyMDAxMCIsInQiOjE1NjE2NzAxMTIzODQsImgiOiI3ODU3Y2RiM2NlZmIzM2U1ZWMyOGJhYmQ1YzRkOTJmY2M4ZjdlODYyMTcxNDEzZGU4YmRjODQ2YzdjMjg0ODFiIn0="},"referrer":"https://www.grubhub.com/lets-eat","referrerPolicy":"no-referrer-when-downgrade",
,"method":"POST","mode":"cors"});

*/
module.exports = services;