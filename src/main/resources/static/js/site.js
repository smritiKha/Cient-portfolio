/** @format */

const api = (path) => fetch(path, { headers: { Accept: 'application/json' } });
const isLivePreview = window.location.port === '5500';
const assetUrl = (path) => {
	if (isLivePreview && path?.startsWith('/images/'))
		return `/src/main/resources/static${path}`;
	if (isLivePreview && path?.startsWith('/uploads/')) return `/data${path}`;
	return path || '';
};
const text = (element, value) => {
	element.textContent = value || '';
};

function addDish(dish, container, isSignatureDish) {
	const card = document.createElement('article');
	card.className = 'dish-card';
	if (dish.image) {
		const image = document.createElement('img');
		image.className = 'dish-image';
		image.src = assetUrl(dish.image);
		image.style.objectFit =
			dish.imageFit === 'contain' ? 'contain' : 'cover';
		image.alt = dish.title
			? `${dish.title} by Roman Rai`
			: 'A dish from Roman Rai’s portfolio';
		image.loading = 'lazy';
		card.append(image);
	} else {
		const image = document.createElement('div');
		image.className = 'dish-image dish-image-placeholder';
		image.setAttribute('aria-hidden', 'true');
		image.textContent = 'RR';
		card.append(image);
	}
	if (dish.cuisine) {
		const cuisine = document.createElement('p');
		cuisine.className = 'dish-cuisine';
		text(cuisine, dish.cuisine);
		card.append(cuisine);
	}
	if (isSignatureDish) {
		const signature = document.createElement('p');
		signature.className = 'dish-signature';
		text(signature, 'Signature dish');
		card.append(signature);
	}
	const title = document.createElement('h3');
	text(title, dish.title);
	card.append(title);
	if (dish.description) {
		const description = document.createElement('p');
		text(description, dish.description);
		card.append(description);
	}
	container.append(card);
}

function addExperience(entry, container) {
	const article = document.createElement('article');
	article.className = 'experience-entry';
	const venue = document.createElement('div');
	const name = document.createElement('h3');
	text(name, entry.venue);
	const location = document.createElement('p');
	text(location, entry.location);
	venue.append(name, location);
	const role = document.createElement('div');
	const title = document.createElement('p');
	text(title, entry.role);
	const details = document.createElement('p');
	text(details, entry.details);
	role.append(title, details);
	const dates = document.createElement('p');
	dates.className = 'experience-dates';
	text(dates, entry.dates);
	article.append(venue, role, dates);
	container.append(article);
}

async function loadPortfolio() {
	try {
		let response = await api(
			isLivePreview ? '/data/portfolio.json' : '/api/portfolio',
		);
		if (!response.ok && !isLivePreview)
			response = await api('/data/portfolio.json');
		if (!response.ok)
			throw new Error('Portfolio data is not available yet.');
		const data = await response.json();
		const adminLink = document.getElementById('admin-link');
		if (isLivePreview)
			adminLink.href = `http://${window.location.hostname}:8080/admin`;
		const profile = data.profile || {};
		const dishList = document.getElementById('dish-list');
		dishList.dataset.signatureDishId = data.signatureDishId || '';
		text(document.getElementById('nav-name'), profile.name);
		text(document.getElementById('hero-name'), profile.name);
		text(document.getElementById('footer-name'), profile.name);
		text(document.getElementById('hero-role'), profile.role);
		text(document.getElementById('hero-headline'), profile.headline);
		text(document.getElementById('availability'), profile.availability);
		text(document.getElementById('about-copy'), profile.about);
		text(document.getElementById('hero-location'), profile.location);
		text(document.getElementById('contact-location'), profile.location);
		document.getElementById('chef-portrait').src = assetUrl(
			profile.portrait || '/images/chef-placeholder.jpg',
		);
		document.getElementById('chef-portrait').alt =
			`Chef portrait of ${profile.name || 'Roman Rai'}`;
		const emailLink = document.getElementById('email-link');
		if (profile.email) {
			emailLink.href = `mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent('Kitchen opportunity')}`;
			emailLink.hidden = false;
		} else {
			emailLink.hidden = true;
			text(
				document.getElementById('contact-copy'),
				'Contact details will appear here once added by the portfolio owner.',
			);
		}
		const phoneLink = document.getElementById('contact-phone');
		const phone = profile.phone || '';
		phoneLink.hidden = !phone;
		if (phone) {
			phoneLink.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
			text(document.getElementById('contact-phone-text'), phone);
		}
		const skills = document.getElementById('skill-list');
		skills.replaceChildren();
		(profile.skills || []).filter(Boolean).forEach((skill) => {
			const item = document.createElement('span');
			item.className = 'skill-item';
			text(item, skill);
			skills.append(item);
		});
		const dishes = dishList;
		dishes.replaceChildren();
		if (data.dishes?.length)
			data.dishes.forEach((dish) =>
				addDish(dish, dishes, dish.id === data.signatureDishId),
			);
		else {
			const empty = document.createElement('p');
			empty.className = 'empty-state';
			text(empty, 'Selected dishes will be added here.');
			dishes.append(empty);
		}
		const experience = document.getElementById('experience-list');
		experience.replaceChildren();
		if (data.experience?.length)
			data.experience.forEach((entry) =>
				addExperience(entry, experience),
			);
		else {
			const empty = document.createElement('p');
			empty.className = 'empty-state';
			text(empty, 'Professional experience will be added here.');
			experience.append(empty);
		}
		document.title = `${profile.name || 'Roman Rai'} | ${profile.role || 'Chef'}`;
	} catch (error) {
		text(
			document.getElementById('availability'),
			'Portfolio details are temporarily unavailable.',
		);
	}
}

const menuButton = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');
menuButton.addEventListener('click', () => {
	const expanded = menuButton.getAttribute('aria-expanded') === 'true';
	menuButton.setAttribute('aria-expanded', String(!expanded));
	menuButton.setAttribute(
		'aria-label',
		expanded ? 'Open navigation' : 'Close navigation',
	);
	siteNav.classList.toggle('is-open', !expanded);
});
siteNav.addEventListener('click', (event) => {
	if (event.target.closest('a')) {
		siteNav.classList.remove('is-open');
		menuButton.setAttribute('aria-expanded', 'false');
		menuButton.setAttribute('aria-label', 'Open navigation');
	}
});
document.getElementById('year').textContent = new Date().getFullYear();
loadPortfolio();
