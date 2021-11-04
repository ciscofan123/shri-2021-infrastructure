#!/usr/bin/env node
const axios = require('axios');
const {TRACKER_API, TRACKER_ID, GITHUB_API, REPOSITORY_URL} = require('./../config.js');
export const OAUTH = process.env['yandexToken'];

const createReleaseTicket = async (uniqueId, summary, description) => {
	await axios({
		url: `${TRACKER_API}/v2/issues`,
		method: 'POST',
		data: {
			queue: 'TMP',
			summary: summary,
			description: description,
			type: 'task',
			unique: uniqueId
		},
		headers: {
			Authorization: `OAuth ${OAUTH}`,
			'X-Org-Id': TRACKER_ID
		}
	}).then(res => console.log(res.data))
		.catch(e => console.log(e));
}

const updateReleaseTicket = async (ticketId, summary, description) => {
	await axios({
		url: `${TRACKER_API}/v2/issues/${ticketId}`,
		method: 'PATCH',
		data: {
			queue: 'TMP',
			summary: summary,
			description: description,
			type: 'task'
		},
		headers: {
			Authorization: `OAuth ${OAUTH}`,
			'X-Org-Id': TRACKER_ID
		}
	}).then(res => console.log(res.data))
		.catch(e => console.log(e));
}

const findTicket = async (uniqueId) => {
	let array = [];
	await axios({
		url: `${TRACKER_API}/v2/issues/_search`,
		method: 'POST',
		data: {
			filter: {
				queue: 'TMP',
				unique: uniqueId
			},
		},
		headers: {
			Authorization: `OAuth ${OAUTH}`,
			'X-Org-Id': TRACKER_ID
		}
	}).then(res => {
		array = res.data;
		//res.data.forEach(item => console.log('item.createdBy: ', item.createdBy));
	})
		.catch(e => console.log(e))
	;
	return array;
}

const getTagMeta = async (url) => {
	let result = {};
	await axios({
		method: 'GET',
		url: url
	})
		.then((response) => { result = response.data.tagger; })
		.catch(console.error);
	return result;
}

const getTags = async () => {
	const tags = [];

	await axios({
		method: 'GET',
		url: `${GITHUB_API}/repos/${REPOSITORY_URL}/git/refs/tags`
	})
		.then(res => {
			tags.push(...res.data);
		})
		.catch(e => console.log(e));

	return tags.map(tag => {
		return {
			ref: tag.ref,
			ver: tag.ref.split('/')[2],
			url: tag.url,
			object: tag.object
		}
	}).sort();
}

const getTagsDiff = async (prevTag, lastTag) => {
	const result = [];

	await axios({
		method: 'GET',
		url: `${GITHUB_API}/repos/${REPOSITORY_URL}/compare/${prevTag}...${lastTag}`
	})
		.then(res => {
			result.push(...res.data.commits);
		})
		.catch(e => console.log(e));

	return result.map(commit => ({
		author: commit.commit.author,
		message: commit.commit.message,
		url: commit.html_url,
		//tagCreatedAt: commit.createdAt,
		//tagAuthor: commit.createdBy.display
	}));
}

const createUniqueName = (prefix, tagName) => {
	return `${prefix}/${tagName}`;
}

const createRelease = async () => {
	const tags = await getTags();

	const lastTagMeta = await getTagMeta(tags[tags.length-1].object.url);

	if (!tags || !tags.length) return;

	const lastTag = tags[tags.length - 1];
	const prevTag = tags.length < 2 ? lastTag : tags[tags.length - 2];
	const diff = await getTagsDiff(prevTag.ref, lastTag.ref);

	const ticketId = createUniqueName(REPOSITORY_URL, lastTag.ver);
	const tickets = await findTicket(ticketId);
	if (tickets.length) {
		updateReleaseTicket(tickets[0].id, `Release artifact ${lastTag.ver}`, createReleaseNotes(lastTagMeta, lastTag.ver, diff));
	} else {
		createReleaseTicket(ticketId, `Release artifact ${lastTag.ver}`, createReleaseNotes(lastTagMeta, lastTag.ver, diff));
	}

}

const createReleaseNotes = (tagMeta, version, diff) => {
	var result = `Version: ${version}\nDate: ${tagMeta.date}\nAuthor: ${tagMeta.name}\n\nRELEASE NOTES:\n`;
	for (let commit of diff) {
		result += `[${commit.author.date}] ${commit.message}\n`;
	}
	return result;
}

createRelease();