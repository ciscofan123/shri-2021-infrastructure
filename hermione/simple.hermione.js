const assert = require('assert');

describe('Конвертер валют', ()=>{
	it('должен появиться на странице', async function(){
		const browser = this.browser;
		await browser.url('/');
		await browser.keys(['курс доллара к рублю','Enter']);
		const converter = await browser.$('.converter-form');
		const isExisting = await converter.isExisting();
		assert.ok(isExisting, 'Конвертер валют не появился');
	})
})