class LoginPage {
    get username() {
        return $('#username');
    }

    get password() {
        return $('#password');
    }

    get loginBtn() {
        return $('button[type="submit"]');
    }

    get flash() {
        return $('#flash');
    }

    async open() {
        await browser.url('https://the-internet.herokuapp.com/login');
    }

    async login(username, password) {
        await this.username.waitForDisplayed({ timeout: 10000 });
        await this.username.setValue(username);

        await this.password.waitForDisplayed({ timeout: 10000 });
        await this.password.setValue(password);

        await this.loginBtn.click();
    }
}

module.exports = new LoginPage();