/** @format */

const form = document.getElementById('login-form');
const message = document.getElementById('login-message');

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	message.textContent = '';
	const button = form.querySelector('button[type="submit"]');
	button.disabled = true;
	try {
		const csrfResponse = await fetch('/api/csrf', { cache: 'no-store' });
		const csrf = await csrfResponse.json();
		const fields = new URLSearchParams(new FormData(form));
		const response = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-XSRF-TOKEN': csrf.token,
			},
			body: fields,
		});
		if (!response.ok)
			throw new Error('That username and password did not match.');
		await fetch('/api/csrf', { cache: 'no-store' });
		window.location.assign('/admin/index.html');
	} catch (error) {
		message.textContent =
			error.message || 'Could not sign in. Please try again.';
	} finally {
		button.disabled = false;
	}
});
