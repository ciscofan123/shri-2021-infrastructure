#!/bin/bash

apiURL="https://api.tracker.yandex.net/v2/issues/_search"
lastTag=$(git tag | sort -r | head -n1)
echo $lastTag
id="ciscofan123/shri-2021-infrastructure/${lastTag}"

authHeader="Authorization: OAuth AQAAAABX6a9zAAd45o57jeQ8i07jkLtXtUKNSKQ"
orgidHeader="X-Org-Id: 6461097"
contentHeader="Content-Type: application/json"


docker build . -f Dockerfile -t store_app:${lastTag}

if [ $? = "0" ]
then
	echo "Docker was built successfully"
else
	echo "Failed to build docker image"
	exit 1
fi

imageId=`docker images | grep v2.1 | awk '{print $3} {print $7}' | grep head -1`
imageSize=`docker images | grep v2.1 | awk '{print $3} {print $7}' | grep tail -1`

ticket=$(curl --silent --location --request POST ${apiURL} \
    --header "${authHeader}" \
    --header "${orgidHeader}" \
    --header "${contentHeader}" \
    --data-raw '{
        "filter": {
            "queue": "'TMP'",
            "unique": "'${id}'"
        }
    }'
)

TICKETID=`echo $ticket | sed 's/\([^\,]*\)"id":"\([^"]*\)\(.*\)/\1\n\2/' | tail -1`
echo "TICKET ID:${TICKETID}"


RESULT=$(curl --silent --location --request POST https://api.tracker.yandex.net/v2/issues/${TICKETID}/comments \
    --header "${authHeader}" \
    --header "${orgidHeader}" \
    --header "${contentHeader}" \
    --data-raw '{
                   "text": "Docker образ создан\nImageId: ${imageId}\nРазмер образа: ${imageSize}"
                }'
)