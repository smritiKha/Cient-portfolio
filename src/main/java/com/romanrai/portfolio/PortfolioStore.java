package com.romanrai.portfolio;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class PortfolioStore {
    private final ObjectMapper mapper;
    private final Path dataDirectory;
    private final Path dataFile;
    private final Path uploadDirectory;
    private PortfolioData data;

    public PortfolioStore(ObjectMapper mapper, @Value("${portfolio.data-dir:data}") String dataDirectory) {
        this.mapper = mapper;
        this.dataDirectory = Path.of(dataDirectory).toAbsolutePath().normalize();
        this.dataFile = this.dataDirectory.resolve("portfolio.json");
        this.uploadDirectory = this.dataDirectory.resolve("uploads");
    }

    @PostConstruct
    public synchronized void initialize() throws IOException {
        Files.createDirectories(uploadDirectory);
        if (Files.exists(dataFile)) {
            data = mapper.readValue(dataFile.toFile(), PortfolioData.class);
        } else {
            data = new PortfolioData();
            save();
        }
        if (data.profile == null) data.profile = new PortfolioData.Profile();
        if (data.profile.portrait == null || data.profile.portrait.isBlank()
                || data.profile.portrait.contains("photo-1577219491135")) {
            data.profile.portrait = new PortfolioData.Profile().portrait;
        }
        if ("Culinary Art | In Motion".equals(data.profile.headline)) {
            data.profile.headline = new PortfolioData.Profile().headline;
        }
        if (data.schemaVersion < 1) {
            migrateCvProfileDefaults();
            data.schemaVersion = 1;
        }
        if (data.dishes == null) data.dishes = new ArrayList<>();
        if (!data.staticDishesSeeded) {
            List<PortfolioData.Dish> missingStaticDishes = starterDishes().stream()
                    .filter(starter -> data.dishes.stream()
                            .noneMatch(existing -> starter.id.equals(existing.id)))
                    .toList();
            data.dishes.addAll(0, missingStaticDishes);
            data.staticDishesSeeded = true;
            data.dishesManaged = true;
        }
        if (!data.dishes.isEmpty()) data.dishesManaged = true;
        if (findDish(data.signatureDishId) == null && !data.dishes.isEmpty()) {
            data.signatureDishId = data.dishes.get(0).id;
        }
        if (findDish(data.compositionDishId) == null && !data.dishes.isEmpty()) {
            data.compositionDishId = data.dishes.size() > 1
                    ? data.dishes.get(1).id
                    : data.dishes.get(0).id;
        }
        if (data.experience == null) data.experience = new ArrayList<>();
        if (data.experience.isEmpty() && !data.experienceManaged) {
            data.experience.addAll(starterExperience());
        }
        save();
    }

    private void migrateCvProfileDefaults() {
        PortfolioData.Profile profile = data.profile;
        PortfolioData.Profile defaults = new PortfolioData.Profile();
        String previousAbout = "I believe good cooking starts with respect: for the ingredient, the people making the meal, and the person sitting down to enjoy it. My approach is curious, hands-on, and grounded in the rhythm of a professional kitchen.";
        String[] previousSkills = {"Mise en place", "Knife skills", "Station organization", "Sauces & seasoning", "Plating", "Team communication"};

        if (profile.role == null || profile.role.isBlank() || "Chef de Partie".equals(profile.role)) profile.role = defaults.role;
        if (profile.headline == null || profile.headline.isBlank() || "I cook with intention.".equals(profile.headline)
                || "Culinary Art | In Motion".equals(profile.headline)) profile.headline = defaults.headline;
        if (profile.about == null || profile.about.isBlank() || previousAbout.equals(profile.about)) profile.about = defaults.about;
        if (profile.email == null || profile.email.isBlank()) profile.email = defaults.email;
        if (profile.phone == null || profile.phone.isBlank()) profile.phone = defaults.phone;
        if (profile.location == null || profile.location.isBlank()) profile.location = defaults.location;
        if (profile.availability == null || profile.availability.isBlank() || "Open to the right kitchen and the right team.".equals(profile.availability)) profile.availability = defaults.availability;
        if (profile.referenceNote == null || profile.referenceNote.isBlank()) profile.referenceNote = defaults.referenceNote;
        if (profile.skills == null || profile.skills.length == 0 || Arrays.equals(profile.skills, previousSkills)) profile.skills = defaults.skills;
        if (profile.education == null || profile.education.length == 0) profile.education = defaults.education;
        if (profile.languages == null || profile.languages.length == 0) profile.languages = defaults.languages;
    }

    public synchronized PortfolioData get() {
        return mapper.convertValue(data, PortfolioData.class);
    }

    public synchronized void updateProfile(PortfolioData.Profile profile) throws IOException {
        data.profile = profile;
        save();
    }

    public synchronized PortfolioData.Dish saveDish(PortfolioData.Dish dish) throws IOException {
        if (dish.id == null || dish.id.isBlank()) {
            dish.id = UUID.randomUUID().toString();
            data.dishes.add(dish);
        } else {
            int index = -1;
            for (int i = 0; i < data.dishes.size(); i++) {
                if (dish.id.equals(data.dishes.get(i).id)) index = i;
            }
            if (index < 0) throw new IllegalArgumentException("Dish not found");
            data.dishes.set(index, dish);
        }
        data.dishesManaged = true;
        save();
        return dish;
    }

    public synchronized void deleteDish(String id) throws IOException {
        boolean removed = data.dishes.removeIf(dish -> id.equals(dish.id));
        if (!removed) throw new IllegalArgumentException("Dish not found");
        if (id.equals(data.signatureDishId)) {
            data.signatureDishId = data.dishes.isEmpty() ? null : data.dishes.get(0).id;
        }
        if (id.equals(data.compositionDishId)) {
            data.compositionDishId = data.dishes.isEmpty()
                    ? null
                    : data.dishes.size() > 1 ? data.dishes.get(1).id : data.dishes.get(0).id;
        }
        data.dishesManaged = true;
        save();
    }

    public synchronized void setSignatureDish(String id) throws IOException {
        requireDish(id);
        data.signatureDishId = id;
        save();
    }

    public synchronized void setCompositionDish(String id) throws IOException {
        requireDish(id);
        data.compositionDishId = id;
        save();
    }

    private PortfolioData.Dish findDish(String id) {
        if (id == null) return null;
        return data.dishes.stream().filter(dish -> id.equals(dish.id)).findFirst().orElse(null);
    }

    private void requireDish(String id) {
        if (findDish(id) == null) throw new IllegalArgumentException("Dish not found");
    }

    public synchronized PortfolioData.Experience saveExperience(PortfolioData.Experience experience) throws IOException {
        if (experience.id == null || experience.id.isBlank()) {
            experience.id = UUID.randomUUID().toString();
            data.experience.add(experience);
        } else {
            int index = -1;
            for (int i = 0; i < data.experience.size(); i++) {
                if (experience.id.equals(data.experience.get(i).id)) index = i;
            }
            if (index < 0) throw new IllegalArgumentException("Experience not found");
            data.experience.set(index, experience);
        }
        data.experienceManaged = true;
        save();
        return experience;
    }

    public synchronized void deleteExperience(String id) throws IOException {
        boolean removed = data.experience.removeIf(entry -> id.equals(entry.id));
        if (!removed) throw new IllegalArgumentException("Experience not found");
        data.experienceManaged = true;
        save();
    }

    public Path uploadDirectory() {
        return uploadDirectory;
    }

    private List<PortfolioData.Dish> starterDishes() {
        return List.of(
                dish("static-sushi-boat", "Sushi Boat", "Japanese",
                        "A sharing boat of assorted sushi rolls, including salmon, avocado, and cucumber combinations.",
                        "/images/sushi_boat.png", "Soy sauce", "Salmon and assorted sushi fillings",
                        "Not specified", "Roe-topped rolls", "Seasoned rice with varied roll fillings"),
                dish("static-volcano-sushi", "Volcano Sushi", "Japanese inspired",
                        "Salmon sushi rolls finished with a creamy orange sauce, spring onion, and a flower garnish.",
                        "/images/volcano-sushi.png", "Creamy orange sauce", "Salmon", "Spring onion",
                        "Edible flower", "Soft rice and nori with a creamy topping"),
                dish("static-tempura-sushi-rolls", "Tempura Sushi Rolls", "Japanese inspired",
                        "Crisp tempura sushi rolls topped with a creamy orange sauce, scallions, and pickled garnish.",
                        "/images/salmon-tempura.png", "Creamy orange sauce", "Tempura filling (not specified)",
                        "Scallions", "Pickled garnish", "Crisp coating with a soft centre"),
                dish("static-salmon-sashimi", "Salmon Sashimi", "Japanese",
                        "Slices of salmon sashimi served with cucumber, wasabi, pickled ginger, and fresh greens.",
                        "/images/sashimi.png", "Not specified (wasabi served on the side)", "Salmon",
                        "Microgreens", "Cucumber and pickled ginger", "Tender sliced salmon"),
                dish("static-tuna-tataki", "Tuna Tataki", "Japanese inspired",
                        "Seared tuna slices with a sesame crust, cucumber, carrot, and dipping sauce.",
                        "/images/tuna-tataki.png", "Soy-based dipping sauce", "Tuna", "Not specified",
                        "Cucumber and carrot", "Seared exterior and rare centre"),
                dish("static-tuna-poke-bowl", "Tuna Poke Bowl Set", "Japanese inspired",
                        "A tuna poke-style bowl with edamame, avocado, corn, and accompaniments served on a tray.",
                        "/images/pork-bowl.png", "Not specified", "Tuna", "Microgreens",
                        "Edamame, avocado, and corn", "Fresh toppings with a rice base"),
                dish("static-a-la-carte-brownie", "A La Carte Brownie", "Dessert",
                        "A chocolate brownie served with vanilla ice cream and a chocolate drizzle.",
                        "/images/ala-carte-brownie.png", "Chocolate sauce", "Chocolate brownie",
                        "Not applicable", "Vanilla ice cream", "Dense brownie with smooth ice cream"),
                dish("static-muffins-brownies", "Muffins and Brownies", "Bakery",
                        "An assortment of muffins and a brownie, presented together on a platter.",
                        "/images/muffins and brownies.png", "None shown", "Muffins and brownie",
                        "Not applicable", "Chocolate pieces", "Soft baked goods"),
                dish("static-egg-cheese-sourdough", "Egg and Cheese with Sourdough", "Breakfast",
                        "Scrambled eggs with cheese and toasted sourdough bread.",
                        "/images/egg and chesse with sour dough.png", "Cheese sauce", "Eggs",
                        "Not specified", "Toasted sourdough", "Soft scrambled eggs with crisp toast"),
                dish("static-buttermilk-pancakes", "Buttermilk Pancakes", "Breakfast",
                        "A stack of buttermilk pancakes with butter and chocolate pieces.",
                        "/images/buttermilk pancake.png", "Syrup", "Buttermilk pancakes",
                        "Not applicable", "Butter and chocolate pieces", "Soft, fluffy pancakes"),
                dish("static-chicken-katsu", "Chicken Katsu with Rice", "Japanese inspired",
                        "Breaded chicken katsu served with steamed rice and shredded cabbage.",
                        "/images/chicken katsu curry.png", "Dark sauce, as pictured", "Chicken",
                        "Not specified", "Shredded cabbage", "Crisp chicken coating with steamed rice"),
                dish("static-new-york-french-toast", "New York French Toast", "Breakfast",
                        "French toast topped with berries and icing sugar, served with whipped cream.",
                        "/images/NYC-french-toast.png", "Berry sauce", "French toast",
                        "Not applicable", "Berries and whipped cream", "Golden toast with soft fruit"));
    }

    private PortfolioData.Dish dish(String id, String title, String cuisine, String description,
            String image, String sauce, String protein, String herbs, String garnish, String texture) {
        PortfolioData.Dish dish = new PortfolioData.Dish();
        dish.id = id;
        dish.title = title;
        dish.cuisine = cuisine;
        dish.description = description;
        dish.image = image;
        dish.sauce = sauce;
        dish.protein = protein;
        dish.herbs = herbs;
        dish.garnish = garnish;
        dish.texture = texture;
        return dish;
    }

        private List<PortfolioData.Experience> starterExperience() {
        return List.of(
            experience("mamagato-2021", "Mamagato", "Demi CDP", "Siliguri, India", "2021–2022",
                "Kept essential ingredients ready for daily service, followed direction from the Executive and Sous Chefs, and monitored supply levels."),
            experience("labarra-2023", "LaBarra Nikkei Modern Japanese Restaurant", "Sushi Chef / Team Leader", "UAE", "2023–2025",
                "Prepared sushi and other menu items to restaurant standards. Managed the assigned station, maintained presentation and consistency, and coordinated with the team during service."),
            experience("noon-2025", "Noon Warehouse", "Assistant Supervisor", "UAE", "Jun 2025–Oct 2025",
                "Managed daily inventory operations, receiving, inspecting, and recording incoming stock while maintaining accurate inventory records."),
            experience("taisuke-2025", "Taisuke Restaurant", "Chef de Partie / Team Leader", "UAE", "Nov 2025–Feb 2026",
                "Maintained food quality, hygiene, and consistency during service. Supported menu development, portion control, waste reduction, and service for staff and guests."),
            experience("hudson-2026", "Hudson & Rye", "Senior Chef de Partie", "UAE", "Jun 2026–Present",
                "Lead and motivate the section team during high-volume service. Maintain consistency in preparation, presentation, and timing; oversee mise en place, stock rotation, ordering, and waste reduction."));
        }

        private PortfolioData.Experience experience(String id, String venue, String role, String location, String dates, String details) {
        PortfolioData.Experience entry = new PortfolioData.Experience();
        entry.id = id;
        entry.venue = venue;
        entry.role = role;
        entry.location = location;
        entry.dates = dates;
        entry.details = details;
        return entry;
        }

    private void save() throws IOException {
        Path temporaryFile = dataDirectory.resolve("portfolio.json.tmp");
        mapper.writerWithDefaultPrettyPrinter().writeValue(temporaryFile.toFile(), data);
        try {
            Files.move(temporaryFile, dataFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException exception) {
            Files.move(temporaryFile, dataFile, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
