

var header = {
    'Content-Type': 'application/json'
}

function setPostBody(api, body) {
    var option = {
        url: 'http://localhost:3000/api/' + api,
        method: 'POST',
        header: this.header,
        form: body
    }

    return option;
}

var invoke = async function (channelName, api, body, txData, mongodb) {

    var postBody = setPostBody(api, body);

    request(postBody, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            return response;
        } else if (response.statusCode == 500) {
            console.log(response);

            return response;
        }
    });
}

exports.invoke = invoke;