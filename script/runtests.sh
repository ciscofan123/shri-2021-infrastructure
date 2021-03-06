#!/bin/bash

apiURL="https://api.tracker.yandex.net/v2/issues/_search"
lastTag=$(git tag | sort -r | head -n1)
echo $lastTag
id="ciscofan123/shri-2021-infrastructure/${lastTag}"

authHeader="Authorization: OAuth ${yandexToken}"
orgidHeader="X-Org-Id: 6461097"
contentHeader="Content-Type: application/json"

# 1. Прогнать тесты
# 2. Получить id или ключ тикета
# 3. Добавить комментарий в тикет?

echo "yandexToken: $yandexToken"

# Autotests
npx jest
if [ $? = "0" ]
then
	echo "no error"
else
	echo "Tests are failed"
	exit 1
fi
# echo "testStatus ${testStatus}"

#if [FAIL]
#then
#  echo "Autotests failed"
#  exit 1
#fi

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

# echo $ticket | json_pp
# echo $ticket | python -mjson.tool
TICKETID=`echo $ticket | sed 's/\([^\,]*\)"id":"\([^"]*\)\(.*\)/\1\n\2/' | tail -1`
echo "TICKET ID:${TICKETID}"
#echo $ticket | python -mjson.tool | grep key | head -n1


RESULT=$(curl --silent --location --request POST https://api.tracker.yandex.net/v2/issues/${TICKETID}/comments \
    --header "${authHeader}" \
    --header "${orgidHeader}" \
    --header "${contentHeader}" \
    --data-raw '{
                   "text": "Тесты прошли успешно"
                }'
)