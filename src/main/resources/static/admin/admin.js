/** @format */

let csrfToken = '';
let portfolio = null;
let dishImageUploadInProgress = false;

async function refreshCsrf() {
	const response = await fetch('/api/csrf', { cache: 'no-store' });
	const payload = await response.json();
	csrfToken = payload.token;
}

async function request(path, options = {}) {
	const headers = new Headers(options.headers || {});
	headers.set('X-XSRF-TOKEN', csrfToken);
	const response = await fetch(path, {
		...options,
		headers,
		credentials: 'same-origin',
	});
	if (response.status === 401 || response.redirected) {
		window.location.assign('/admin/login.html');
		throw new Error('Please sign in again.');
	}
	if (!response.ok) {
		const body = await response.text();
		throw new Error(body || `Request failed (${response.status}).`);
	}
	if (response.status === 204) return null;
	return response.json();
}

function setMessage(id, value) {
	document.getElementById(id).textContent = value || '';
}

function setField(id, value) {
	document.getElementById(id).value = value || '';
}

function createAdminItem(title, subtitle, imageUrl, actions, imageFit = 'cover') {
	const item = document.createElement('article');
	item.className = 'admin-item';
	if (imageUrl) {
		const image = document.createElement('img');
		image.src = imageUrl;
		image.alt = '';
		image.loading = 'lazy';
		image.style.objectFit = imageFit === 'contain' ? 'contain' : 'cover';
		item.append(image);
	} else {
		const image = document.createElement('div');
		image.className = 'admin-item-image';
		image.setAttribute('aria-hidden', 'true');
		item.append(image);
	}
	const details = document.createElement('div');
	const heading = document.createElement('h3');
	heading.textContent = title || '';
	const description = document.createElement('p');
	description.textContent = subtitle || '';
	details.append(heading, description);
	const controls = document.createElement('div');
	controls.className = 'item-actions';
	actions.forEach(({ label, run, disabled }) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.textContent = label;
		button.disabled = Boolean(disabled);
		button.addEventListener('click', run);
		controls.append(button);
	});
	item.append(details, controls);
	return item;
}

function renderProfile(profile) {
	setField('profile-name', profile.name);
	setField('profile-role', profile.role);
	setField('profile-headline', profile.headline);
	setField('profile-about', profile.about);
	setField('profile-email', profile.email);
	setField('profile-phone', profile.phone);
	setField('profile-location', profile.location);
	setField('profile-availability', profile.availability);
	setField('profile-skills', (profile.skills || []).join(', '));
	setField('profile-education', (profile.education || []).join('\n'));
	setField('profile-languages', (profile.languages || []).join(', '));
	setField('profile-reference', profile.referenceNote);
	setField('profile-portrait', profile.portrait);
	setField('profile-resume', profile.resumeUrl);
	const preview = document.getElementById('portrait-preview');
	preview.src = profile.portrait || '';
	preview.hidden = !profile.portrait;
}

function renderExperience(entries) {
	const list = document.getElementById('experience-admin-list');
	list.replaceChildren();
	entries.forEach((entry) => {
		const item = createAdminItem(
			entry.venue,
			[entry.role, entry.location, entry.dates]
				.filter(Boolean)
				.join(' · '),
			'',
			[
				{
					label: 'Edit',
					run: () => {
						setField('experience-id', entry.id);
						setField('experience-venue', entry.venue);
						setField('experience-role', entry.role);
						setField('experience-location', entry.location);
						setField('experience-dates', entry.dates);
						setField('experience-details', entry.details);
						document.getElementById('experience-cancel').hidden =
							false;
					},
				},
				{
					label: 'Delete',
					run: () =>
						removeEntry(
							`/api/admin/experience/${encodeURIComponent(entry.id)}`,
							'Experience entry removed.',
						),
				},
			],
		);
		list.append(item);
	});
}

function renderDishes(entries) {
	const list = document.getElementById('dish-admin-list');
	list.replaceChildren();
	entries.forEach((dish) => {
		const actions = [
			{
				label: dish.id === portfolio.signatureDishId
					? 'Signature dish'
					: 'Set as signature',
				run: () => setDishDisplayRole(dish.id, 'signature'),
				disabled: dish.id === portfolio.signatureDishId,
			},
			{
				label: dish.id === portfolio.compositionDishId
					? 'Plate elements'
					: 'Use for plate elements',
				run: () => setDishDisplayRole(dish.id, 'composition'),
				disabled: dish.id === portfolio.compositionDishId,
			},
			{
				label: 'Edit',
				run: () => {
					setMessage('dish-message', '');
					setField('dish-id', dish.id);
					setField('dish-title', dish.title);
					setField('dish-cuisine', dish.cuisine);
					setField('dish-description', dish.description);
					setField('dish-image', dish.image);
					setField('dish-image-fit', dish.imageFit || 'cover');
					[
						'sauce',
						'protein',
						'herbs',
						'garnish',
						'texture',
					].forEach((name) =>
						setField(`dish-${name}`, dish[name]),
					);
					document.getElementById('dish-form-heading').textContent =
						`Editing: ${dish.title}`;
					document.getElementById('dish-cancel').hidden = false;
					document
						.getElementById('dish-form')
						.scrollIntoView({ behavior: 'smooth', block: 'center' });
					document.getElementById('dish-title').focus();
				},
			},
			{
				label: 'Delete',
				run: () =>
					removeEntry(
						`/api/admin/dishes/${encodeURIComponent(dish.id)}`,
						'Dish removed.',
					),
			},
		];
		const item = createAdminItem(
			dish.title,
			[dish.cuisine, dish.description].filter(Boolean).join(' · '),
			dish.image,
			actions,
			dish.imageFit,
		);
		list.append(item);
	});
}

async function setDishDisplayRole(id, role) {
	try {
		await request(
			`/api/admin/dishes/${encodeURIComponent(id)}/${role}`,
			{ method: 'PUT' },
		);
		setMessage(
			'page-message',
			role === 'signature'
				? 'Signature dish updated.'
				: 'Elements on the Plate dish updated.',
		);
		await loadAdmin();
	} catch (error) {
		setMessage('page-message', error.message);
	}
}

async function loadAdmin() {
	await refreshCsrf();
	const response = await fetch('/api/admin/portfolio', {
		credentials: 'same-origin',
	});
	if (!response.ok || response.redirected) {
		window.location.assign('/admin/login.html');
		return;
	}
	portfolio = await response.json();
	renderProfile(portfolio.profile || {});
	renderExperience(portfolio.experience || []);
	renderDishes(portfolio.dishes || []);
}

async function removeEntry(path, successMessage) {
	if (!window.confirm('Remove this entry from your portfolio?')) return;
	try {
		await request(path, { method: 'DELETE' });
		setMessage('page-message', successMessage);
		await loadAdmin();
	} catch (error) {
		setMessage('page-message', error.message);
	}
}

async function uploadImage(file, targetId, messageId) {
	if (!file) return;
	const form = new FormData();
	form.append('file', file);
	const isDishImage = targetId === 'dish-image';
	const dishImageInput = isDishImage
		? document.getElementById('dish-image')
		: null;
	const dishFileInput = isDishImage
		? document.getElementById('dish-file')
		: null;
	const previousImage = dishImageInput?.value;
	if (isDishImage) {
		dishImageUploadInProgress = true;
		dishImageInput.disabled = true;
		document.querySelector('#dish-form button[type="submit"]').disabled =
			true;
		setMessage(messageId, 'Uploading photo…');
	}
	try {
		const result = await request('/api/admin/images', {
			method: 'POST',
			body: form,
		});
		setField(targetId, result.url);
		if (isDishImage) dishFileInput.value = '';
		if (targetId === 'profile-portrait') {
			const preview = document.getElementById('portrait-preview');
			preview.src = result.url;
			preview.hidden = false;
		}
		setMessage(messageId, 'Photo uploaded. Save the form to publish it.');
	} catch (error) {
		if (isDishImage) setField(targetId, previousImage);
		setMessage(messageId, error.message);
	} finally {
		if (isDishImage) {
			dishImageUploadInProgress = false;
			dishImageInput.disabled = false;
			document.querySelector('#dish-form button[type="submit"]').disabled =
				false;
		}
	}
}

async function uploadResume(file) {
	if (!file) return;
	const form = new FormData();
	form.append('file', file);
	try {
		const result = await request('/api/admin/resume', {
			method: 'POST',
			body: form,
		});
		setField('profile-resume', result.url);
		setMessage(
			'profile-message',
			'CV uploaded. Save the profile to publish it.',
		);
	} catch (error) {
		setMessage('profile-message', error.message);
	}
}

document
	.getElementById('profile-form')
	.addEventListener('submit', async (event) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const profile = {
			name: form.get('name'),
			role: form.get('role'),
			headline: form.get('headline'),
			about: form.get('about'),
			email: form.get('email'),
			phone: form.get('phone'),
			location: form.get('location'),
			availability: form.get('availability'),
			referenceNote: form.get('referenceNote'),
			portrait: form.get('portrait'),
			resumeUrl: form.get('resumeUrl'),
			skills: form
				.get('skills')
				.split(',')
				.map((skill) => skill.trim())
				.filter(Boolean),
			education: form
				.get('education')
				.split('\n')
				.map((entry) => entry.trim())
				.filter(Boolean),
			languages: form
				.get('languages')
				.split(',')
				.map((language) => language.trim())
				.filter(Boolean),
		};
		try {
			await request('/api/admin/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(profile),
			});
			setMessage('profile-message', 'Profile saved.');
		} catch (error) {
			setMessage('profile-message', error.message);
		}
	});

document
	.getElementById('experience-form')
	.addEventListener('submit', async (event) => {
		event.preventDefault();
		const formElement = event.currentTarget;
		const id = document.getElementById('experience-id').value;
		const entry = Object.fromEntries(
			['venue', 'role', 'location', 'dates', 'details'].map((name) => [
				name,
				document.getElementById(`experience-${name}`).value,
			]),
		);
		const path = id
			? `/api/admin/experience/${encodeURIComponent(id)}`
			: '/api/admin/experience';
		try {
			await request(path, {
				method: id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(entry),
			});
			formElement.reset();
			setField('experience-id', '');
			document.getElementById('experience-cancel').hidden = true;
			setMessage('experience-message', 'Experience saved.');
			await loadAdmin();
		} catch (error) {
			setMessage('experience-message', error.message);
		}
	});

document
	.getElementById('dish-form')
	.addEventListener('submit', async (event) => {
		event.preventDefault();
		const formElement = event.currentTarget;
		if (dishImageUploadInProgress) {
			setMessage('dish-message', 'Wait for the photo upload to finish.');
			return;
		}
		const id = document.getElementById('dish-id').value;
		const dish = Object.fromEntries(
			[
				'title',
				'cuisine',
				'description',
				'image',
				'sauce',
				'protein',
				'herbs',
				'garnish',
				'texture',
			].map((name) => [
				name,
				document.getElementById(`dish-${name}`).value,
			]),
		);
		dish.imageFit = document.getElementById('dish-image-fit').value;
		const path = id
			? `/api/admin/dishes/${encodeURIComponent(id)}`
			: '/api/admin/dishes';
		try {
			await request(path, {
				method: id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(dish),
			});
			formElement.reset();
			setField('dish-id', '');
			document.getElementById('dish-form-heading').textContent =
				'Add a dish';
			document.getElementById('dish-cancel').hidden = true;
			setMessage('dish-message', 'Dish saved.');
			await loadAdmin();
		} catch (error) {
			setMessage('dish-message', error.message);
		}
	});

document
	.getElementById('profile-file')
	.addEventListener('change', (event) =>
		uploadImage(
			event.target.files[0],
			'profile-portrait',
			'profile-message',
		),
	);
document
	.getElementById('resume-file')
	.addEventListener('change', (event) => uploadResume(event.target.files[0]));
document
	.getElementById('dish-file')
	.addEventListener('change', (event) => {
		uploadImage(event.target.files[0], 'dish-image', 'dish-message');
	});
document.getElementById('experience-cancel').addEventListener('click', () => {
	document.getElementById('experience-form').reset();
	setField('experience-id', '');
	document.getElementById('experience-cancel').hidden = true;
});
document.getElementById('dish-cancel').addEventListener('click', () => {
	document.getElementById('dish-form').reset();
	setField('dish-id', '');
	document.getElementById('dish-form-heading').textContent = 'Add a dish';
	document.getElementById('dish-cancel').hidden = true;
});
document.getElementById('logout-button').addEventListener('click', async () => {
	try {
		await request('/logout', { method: 'POST' });
	} finally {
		window.location.assign('/admin/login.html');
	}
});

loadAdmin().catch((error) => setMessage('page-message', error.message));
