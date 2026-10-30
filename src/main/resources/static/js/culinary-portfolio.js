/** @format */

window.romanPortfolioContentLoaded = true;

function renderExperience(entries) {
	const container = document.getElementById('experience-list');
	container.replaceChildren();
	if (!entries.length) {
		const empty = document.createElement('p');
		empty.className = 'text-sm text-gray-400';
		empty.textContent = 'Add your kitchen experience in Admin.';
		container.append(empty);
		return;
	}
	entries.forEach((entry) => {
		const article = document.createElement('article');
		article.className =
			'glass-panel rounded-2xl border border-white/10 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6';
		const venue = document.createElement('h3');
		venue.className = 'font-serif text-lg text-white';
		venue.textContent = entry.venue || '';
		const detail = document.createElement('div');
		const role = document.createElement('p');
		role.className = 'text-sm text-gold';
		role.textContent = entry.role || '';
		const contribution = document.createElement('p');
		contribution.className = 'text-xs text-gray-400 mt-2';
		contribution.textContent = entry.details || '';
		detail.append(role, contribution);
		const meta = document.createElement('p');
		meta.className = 'text-xs text-gray-400 md:text-right';
		meta.textContent = [entry.location, entry.dates]
			.filter(Boolean)
			.join(' · ');
		article.append(venue, detail, meta);
		container.append(article);
	});
}

function renderSkills(skills) {
	const container = document.getElementById('skill-list');
	container.replaceChildren();
	skills.filter(Boolean).forEach((skill) => {
		const item = document.createElement('div');
		item.className = 'flex items-center gap-3 py-2 text-gray-200';
		const mark = document.createElement('i');
		mark.className = 'fa-solid fa-check text-gold';
		mark.setAttribute('aria-hidden', 'true');
		const label = document.createElement('span');
		label.textContent = skill;
		item.append(mark, label);
		container.append(item);
	});
}

function renderTextList(container, entries, className) {
	container.replaceChildren();
	entries.filter(Boolean).forEach((entry) => {
		const item = document.createElement('p');
		item.className = className;
		item.textContent = entry;
		container.append(item);
	});
}

const mobileNavToggle = document.getElementById('mobile-nav-toggle');
const primaryNavigation = document.getElementById('primary-navigation');
const adminLink = document.querySelector('a[href="/admin"]');
if (adminLink && window.location.port === '5500') {
	adminLink.href = `http://${window.location.hostname}:8080/admin`;
}
mobileNavToggle.addEventListener('click', () => {
	const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
	mobileNavToggle.setAttribute('aria-expanded', String(!isExpanded));
	mobileNavToggle.setAttribute(
		'aria-label',
		isExpanded ? 'Open navigation' : 'Close navigation',
	);
	primaryNavigation.classList.toggle('mobile-open', !isExpanded);
});
primaryNavigation.addEventListener('click', (event) => {
	if (event.target.closest('a')) {
		primaryNavigation.classList.remove('mobile-open');
		mobileNavToggle.setAttribute('aria-expanded', 'false');
		mobileNavToggle.setAttribute('aria-label', 'Open navigation');
	}
});

async function loadPortfolioContent() {
	try {
		let response;
		if (window.location.port !== '5500') {
			response = await fetch('/api/portfolio', {
				headers: { Accept: 'application/json' },
			});
		}
		if (!response?.ok) {
			response = await fetch('/data/portfolio.json', {
				headers: { Accept: 'application/json' },
			});
		}
		if (!response.ok) throw new Error('Portfolio data unavailable');
		const data = await response.json();
		const profile = data.profile || {};
		const dishes = data.dishes?.length
			? data.dishes.map((dish) => ({
					id: dish.id,
					name: dish.title,
					cuisine: dish.cuisine,
					desc: dish.description,
					img: dish.image,
					imageFit: dish.imageFit,
					sauce: dish.sauce,
					protein: dish.protein,
					herbs: dish.herbs,
					garnish: dish.garnish,
					texture: dish.texture,
				}))
			: defaultDishes;
		portfolioData = {
			signatureDishId: data.signatureDishId,
			compositionDishId: data.compositionDishId,
			dishes,
		};
		document.getElementById('profile-role-nav').textContent =
			profile.role || 'Senior Chef de Partie';
		document.getElementById('profile-availability').textContent =
			profile.availability || '';
		document.getElementById('profile-about').textContent =
			profile.about || '';
		document.getElementById('kitchen-profile-name').textContent =
			profile.name || 'Roman Rai';
		document.getElementById('kitchen-profile-role').textContent =
			profile.role || 'Senior Chef de Partie';
		const headline = document.getElementById('profile-headline');
		const headlineText = profile.headline || 'COOKING WITH PURPOSE';
		const headlineParts = headlineText.includes('|')
			? headlineText.split('|').map((part) => part.trim())
			: (() => {
					const wordBreak = headlineText.lastIndexOf(' ');
					return wordBreak > 0
						? [
								headlineText.slice(0, wordBreak).trim(),
								headlineText.slice(wordBreak + 1).trim(),
							]
						: [headlineText, ''];
				})();
		headline.replaceChildren(
			document.createTextNode(headlineParts[0]),
		);
		if (headlineParts[1]) {
			const accent = document.createElement('span');
			accent.className = 'gold-gradient-text italic font-normal';
			accent.textContent = headlineParts[1];
			headline.append(document.createElement('br'), accent);
		}
		const portrait = document.getElementById('chef-portrait');
		if (profile.portrait)
			portrait.src = dishImageUrl(profile.portrait);
		const isStockKitchenImage =
			!profile.portrait ||
			profile.portrait.includes('photo-1577219491135');
		portrait.alt = isStockKitchenImage
			? 'Chef working in a professional kitchen'
			: `Portrait of ${profile.name || 'Roman Rai'}`;
        const heroPortrait = document.getElementById('hero-chef-portrait');
        if (heroPortrait) {
            heroPortrait.src = portrait.src;
            heroPortrait.alt = portrait.alt;
        }
		const portraitCaption = document.getElementById('portrait-caption');
		if (portraitCaption)
			portraitCaption.textContent = isStockKitchenImage
				? 'In the kitchen · service and craft'
				: 'Roman Rai';
		const emailLink = document.getElementById('contact-email');
		const email = profile.email || 'theromanrai@gmail.com';
		emailLink.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Kitchen opportunity')}`;
		document.getElementById('contact-email-text').textContent = email;
		emailLink.hidden = false;
		const phoneLink = document.getElementById('contact-phone');
		const phone = profile.phone || '';
		phoneLink.hidden = !phone;
		if (phone) {
			phoneLink.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
			document.getElementById('contact-phone-text').textContent = phone;
		}
		const cvLink = document.getElementById('cv-link');
		if (profile.resumeUrl) {
			cvLink.href = profile.resumeUrl;
			cvLink.classList.remove('hidden');
			cvLink.classList.add('inline-flex');
		}
		document.getElementById('contact-location').textContent =
			profile.location || '';
		renderTextList(
			document.getElementById('education-list'),
			profile.education || [],
			'text-sm text-gray-300',
		);
		const languageList = document.getElementById('language-list');
		languageList.replaceChildren();
		(profile.languages || []).filter(Boolean).forEach((language) => {
			const item = document.createElement('span');
			item.className = 'text-sm text-gray-200';
			item.textContent = language;
			languageList.append(item);
		});
		document.getElementById('reference-note').textContent =
			profile.referenceNote || '';
		document.getElementById('footer-summary').textContent =
			`${profile.role || 'Senior Chef de Partie'} · Japanese · Peruvian · European influences`;
		document.getElementById('copyright-year').textContent =
			new Date().getFullYear();
		renderExperience(data.experience || []);
		renderSkills(profile.skills || []);
		initApp();
	} catch (error) {
		console.warn(
			'Portfolio API unavailable; retaining preview content.',
			error,
		);
	}
}

loadPortfolioContent();
