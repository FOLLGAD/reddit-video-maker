curl --request PUT \
  'https://www.googleapis.com/youtube/v3/videos?part=status&key=[YOUR_API_KEY]' \
  --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
  --header 'Accept: application/json' \
  --header 'Content-Type: application/json' \
  --data '{"id":"1UA3sz_ZAiE","status":{"privacyStatus":"private","madeForKids":false}}' \
  --compressed
