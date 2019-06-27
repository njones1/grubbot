const messages = {

    formatResults: (restaurants) => {
        console.log('restaurants', JSON.stringify(restaurants));
        var content = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Here are your most recent orders."
                }
            },
            {
                "type": "divider"
            }
        ];
        const results = restaurants.search_result.results.slice(0,3);
        results.forEach(restaurant => {
            const order = restaurant.orders[0];
            const orderItems = order.charges.lines.line_items.map(order => {
                return order.name;
            }).join(', ');
            
            content.push(
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*${restaurant.restaurant_name}*\n${orderItems}`
                    },
                    "accessory": {
                        "type": "image",
                        "image_url": `${order.charges.lines.line_items[0].restaurant.img_url}`,
                        "alt_text": `${restaurant.restaurant_name}`
                    }
                });
            content.push(
                {
                    "type": "actions",
                    "block_id": `${order.id}`,
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "emoji": true,
                                "text": "Express Reorder"
                            },
                            "value": "reorder",
                            "action_id": "reorder"
                        }
                    ]
                });
            content.push(
                {
                    "type": "divider"
                });

        });
        
        console.log('content', JSON.stringify(content));
        return content;
    }
}

module.exports = messages;