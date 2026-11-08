import { cpSync, mkdirSync, copyFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Deploy the original Spring Boot static frontend, including its unchanged 3D design.
const source = 'src/main/resources/static';
const target = 'netlify-dist';
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

// Keep the existing Three.js URL intact: the original HTML references this WebJar path.
const threeSource = 'node_modules/three/build/three.min.js';
if (!existsSync(threeSource)) throw new Error('Three.js missing. Run npm install first.');
const threeTarget = join(target, 'webjars/three/0.127.0/build');
mkdirSync(threeTarget, { recursive: true });
copyFileSync(threeSource, join(threeTarget, 'three.min.js'));

// The Netlify static host has no Spring Boot /api/portfolio endpoint.
// Supply the public starter content for the frontend's existing JSON fallback.
const profile = {
  name: 'Roman Rai',
  role: 'Senior Chef de Partie',
  headline: 'COOKING WITH PURPOSE',
  about: 'My culinary experience spans casual and fine-dining kitchens, with a focus on sushi preparation, station leadership, consistent execution, and thoughtful service. I value precise technique, strong teamwork, and the discipline required to deliver quality throughout service.',
  email: 'theromanrai@gmail.com',
  phone: '0568493578',
  location: 'Burjuman, Dubai, UAE',
  availability: 'Open to meaningful opportunities for culinary growth and collaboration.',
  referenceNote: 'Professional references available upon request.',
  portrait: '/images/me.png',
  resumeUrl: '',
  skills: ['Plating and presentation', 'Composure during service', 'Food quality and consistency', 'Kitchen team leadership', 'Cross-team collaboration', 'Service and time management', 'Mise en place', 'Stock control and rotation'],
  education: ['Intermediate School | Buddha Smriti Education Foundation | 2018 | 3.65 CGPA', 'High School Diploma | Devi Secondary School | 2018–2020 | 3.21 CGPA'],
  languages: ['English', 'Hindi']
};
const dishes = [
  ['Sushi Boat','Japanese','sushi_boat.png'],
  ['Volcano Sushi','Japanese inspired','volcano-sushi.png'],
  ['Tempura Sushi Rolls','Japanese inspired','salmon-tempura.png'],
  ['Salmon Sashimi','Japanese','sashimi.png'],
  ['Tuna Tataki','Japanese inspired','tuna-tataki.png'],
  ['Tuna Poke Bowl Set','Japanese inspired','pork-bowl.png'],
  ['A La Carte Brownie','Dessert','ala-carte-brownie.png'],
  ['Muffins and Brownies','Bakery','muffins and brownies.png'],
  ['Egg and Cheese with Sourdough','Breakfast','egg and chesse with sour dough.png'],
  ['Buttermilk Pancakes','Breakfast','buttermilk pancake.png'],
  ['Chicken Katsu with Rice','Japanese inspired','chicken katsu curry.png'],
  ['New York French Toast','Breakfast','NYC-french-toast.png']
].map(([title,cuisine,image],i) => ({
  id: 'static-' + (i + 1), title, cuisine, image: '/images/' + image,
  description: title, imageFit: 'cover'
}));
const experience = [
  {id:'mamagato-2021',venue:'Mamagato',role:'Demi CDP',location:'Casual Dining & Five-Star Hotel',dates:'2021–2022',details:'Kept essential ingredients ready for daily service, followed direction from the Executive and Sous Chefs, and monitored supply levels.'},
  {id:'labarra-2023',venue:'LaBarra Nikkei Modern Japanese Restaurant',role:'Sushi Chef / Team Leader',location:'UAE',dates:'2023–2025',details:'Prepared sushi and other menu items to restaurant standards. Managed the assigned station, maintained presentation and consistency, and coordinated with the team during service.'},
  {id:'taisuke-2025',venue:'Taisuke Restaurant',role:'Chef de Partie / Team Leader',location:'UAE',dates:'Jun 2025–Feb 2026',details:'Maintained food quality, hygiene, and consistency during service. Supported menu development, portion control, waste reduction, and service for staff and guests.'},
  {id:'hudson-2026',venue:'Hudson & Rye',role:'Senior Chef de Partie',location:'UAE',dates:'Jun 2026–Present',details:'Lead and motivate the section team during high-volume service. Maintain consistency in preparation, presentation, and timing; oversee mise en place, stock rotation, ordering, and waste reduction.'}
];
mkdirSync(join(target,'data'), { recursive:true });
writeFileSync(join(target,'data/portfolio.json'), JSON.stringify({
  schemaVersion:1, profile, dishes, experience,
  signatureDishId:dishes[0].id, compositionDishId:dishes[1].id,
  dishesManaged:true, staticDishesSeeded:true, experienceManaged:true
}, null, 2));

// A static host cannot support the Java-backed admin interface.
rmSync(join(target,'admin'), { recursive: true, force: true });
console.log('Netlify static build ready at ' + target);
