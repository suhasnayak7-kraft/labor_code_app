import json

def handler(request):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'status': 'ok',
            'message': 'Zero-dependency Vercel handler is live'
        })
    }
