const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const port = process.env.PORT || 8080;
const validUrl = require('valid-url');

var parseUrl = function(url) {
    url = decodeURIComponent(url)
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = 'http://' + url;
    }

    return url;
};

app.get('/', function(req, res) {
    var username = req.query.i;
    var password = req.query.w;
    console.log('test', username,password);

    (async() => {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: false
        });
        const page = await browser.newPage();
        await run(username,password,page,browser, res);
        await page.screenshot().then(function(buffer) {
            res.setHeader('Content-Disposition', 'attachment;filename="' + 'test' + '.png"');
            res.setHeader('Content-Type', 'image/png');
            res.send(buffer)
        });

        await browser.close();
    })();

});
async function run(username, password, page, browser, res) {
//const browser = await puppeteer.launch();

await page.goto('https://rudots.t2hosted.com/cmn/auth_guest.aspx');

const USERNAME_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_txtLogin';
const PASSWORD_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_txtPassword';
const LOGIN_BUTTON_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_cmdLogin';
const GET_PERMIT_BUTTON_SELECTOR = 'body > div.container > div:nth-child(7) > div > div:nth-child(2) > section.col-sm-6.col-md-6.col-lg-6.widget-secondary-actions.flex-widget > div > div > a';
const NEXT_BUTTON_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_cmdNext';
const AGREE_CHECKBOX_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_chkAgreement_chk0';
const NEXT_MONTH_EFFECTIVE_BUTTON_SELECTOR =  '#ctl00_ctl01_MainContentPlaceHolder_T2Main_calEffectiveDate > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(3) > a';
const NEXT_MONTH_EXPIRATION_BUTTON_SELECTOR =  '#ctl00_ctl01_MainContentPlaceHolder_T2Main_calExpirationDate > tbody > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(3) > a';
const LOT_INPUT_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_selFacility';
const LIVI_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_selFacility > option:nth-child(8)';
const PAY_NOW_SELECTOR = '#ctl00_ctl01_MainContentPlaceHolder_T2Main_collectEmailForAuthenticatedUser_btnContinue';
const CONTINUE_SELECTOR = '#ctl00_SheetContentPlaceHolder_btnContinue';
const PAY_WITH_CARD_SELECTOR = '#ctl00_SheetContentPlaceHolder_btnAddCreditCard';
const CARD_TYPE_DROPDOWN_SELECTOR = '#ctl00_SheetContentPlaceHolder_AddCreditCard1_drpCardType_drpCardNames';
const lotList = {
    livi: '2180',
    busch: '2178',
    doug: '2179',
    cook: '2181',
}

await page.click(USERNAME_SELECTOR);
await page.keyboard.type(username);

await page.click(PASSWORD_SELECTOR);
await page.keyboard.type(password);

await page.click(LOGIN_BUTTON_SELECTOR);
await page.waitForNavigation();

console.log('Get Permit')
await page.click(GET_PERMIT_BUTTON_SELECTOR);
await page.waitForSelector(NEXT_BUTTON_SELECTOR);

await page.click(NEXT_BUTTON_SELECTOR);
await page.waitForSelector(NEXT_BUTTON_SELECTOR);

await page.click(NEXT_BUTTON_SELECTOR);
await page.waitForSelector(AGREE_CHECKBOX_SELECTOR);

await page.click(AGREE_CHECKBOX_SELECTOR);
await page.click(NEXT_BUTTON_SELECTOR);
await page.waitForNavigation();

// click next month
let effective_date_tr = page.$('#ctl00_ctl01_MainContentPlaceHolder_T2Main_calEffectiveDate > tbody > tr');
if (effective_date_tr.length < 0) {
    await page.click(NEXT_MONTH_EFFECTIVE_BUTTON_SELECTOR);
    await page.waitForSelector('input');
}

let expiration_date_tr = page.$('#ctl00_ctl01_MainContentPlaceHolder_T2Main_calExpirationDate > tbody > tr');
if (expiration_date_tr.length < 0) {
    await page.click(NEXT_MONTH_EXPIRATION_BUTTON_SELECTOR);
    await page.waitForSelector('input');
}

let today = moment().format('MMMM D');

let indexes = await page.evaluate(today => {
    let trs = document.querySelectorAll('#ctl00_ctl01_MainContentPlaceHolder_T2Main_calEffectiveDate > tbody > tr');
    let a;
    trs.forEach((tr,i) =>{
        if (i > 1) {
            tr.childNodes.forEach((td,i2) => {
                if (td.firstChild.getAttribute('title') == today ) {
                    a = [i+1,i2+1];
                }
            })
        }
    })
    return a;
},today);

const EFFECTIVE_DATE_SELECTOR = `#ctl00_ctl01_MainContentPlaceHolder_T2Main_calEffectiveDate > tbody > tr:nth-child(${indexes[0]}) > td:nth-child(${indexes[1]}) > a`;
const EXPIRATION_DATE_SELECTOR = `#ctl00_ctl01_MainContentPlaceHolder_T2Main_calExpirationDate > tbody > tr:nth-child(${indexes[0]}) > td:nth-child(${indexes[1]}) > a`;
await page.click(EFFECTIVE_DATE_SELECTOR);
await page.waitForSelector(NEXT_BUTTON_SELECTOR);

// later I can add buying permits for multiple days
/*
let indexes2 = await page.evaluate(today => {
    let trs = document.querySelectorAll('#ctl00_ctl01_MainContentPlaceHolder_T2Main_calExpirationDate > tbody > tr');
    console.log(trs);
    let a;
    trs.forEach((tr,i) =>{
            console.log(tr);
        if (i > 1) {
            tr.childNodes.forEach((td,i2) => {
                console.log(td.firstChild.getAttribute('title'));
                if (td.firstChild.getAttribute('title') == today ) {
                    a = [i+1,i2+1];
                }
            })
        }
    })
    return a;
},today);
*/

await page.click(EXPIRATION_DATE_SELECTOR);
await page.waitForSelector(NEXT_BUTTON_SELECTOR);

await page.click(NEXT_BUTTON_SELECTOR);
await page.waitForSelector(NEXT_BUTTON_SELECTOR);

// unchecking extra vehicles
/*
await page.click('#ctl00_ctl01_MainContentPlaceHolder_T2Main_dgVehicleList_ctl03_chkChooseVehicles')
await page.click('#ctl00_ctl01_MainContentPlaceHolder_T2Main_dgVehicleList_ctl04_chkChooseVehicles')
*/

await page.click(NEXT_BUTTON_SELECTOR);
await page.waitForSelector(NEXT_BUTTON_SELECTOR);


console.log("Choose the Location")
// livi, busch, doug, cook
await page.select(LOT_INPUT_SELECTOR,lotList.livi);
await page.waitForSelector(NEXT_BUTTON_SELECTOR);
await page.click(NEXT_BUTTON_SELECTOR);
await page.waitForSelector(PAY_NOW_SELECTOR);
console.log("View Cart Pay now")

await page.click(PAY_NOW_SELECTOR);
console.log("View Cart Pay now 2")
await page.waitForSelector('input');
console.log("View Cart Pay now 3")
await page.waitForSelector('input');
console.log("View Cart Pay now 4")

await page.click('#cmdNext');
await page.waitForSelector(CONTINUE_SELECTOR);
console.log("View Cart Pay now 5")

await page.click(CONTINUE_SELECTOR);
console.log("Check out process order details")
await page.waitForSelector(PAY_WITH_CARD_SELECTOR);
await page.click(PAY_WITH_CARD_SELECTOR);
await page.waitForSelector('input');

await page.select(CARD_TYPE_DROPDOWN_SELECTOR,'V');
/*
const SELECT_CARD_SELECTOR = '#ctl00_SheetContentPlaceHolder_AddCreditCard1_drpCardType_btnSelectCard';
await page.click(SELECT_CARD_SELECTOR);
await page.waitForSelector('input');
*/


}

app.listen(port, function() {
    console.log('App listening on port ' + port)
})
