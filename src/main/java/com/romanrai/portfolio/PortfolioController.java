package com.romanrai.portfolio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;

@RestController
public class PortfolioController {
	private final PortfolioStore store;

	public PortfolioController(PortfolioStore store) {
		this.store = store;
	}

	@GetMapping("/api/csrf")
	public Map<String, String> csrf(CsrfToken token) {
		return Map.of("token", token.getToken());
	}

	@GetMapping("/api/portfolio")
	public PortfolioData portfolio() {
		return store.get();
	}

	@GetMapping("/api/admin/portfolio")
	public PortfolioData adminPortfolio() {
		return store.get();
	}

	@PutMapping("/api/admin/profile")
	public PortfolioData.Profile updateProfile(@RequestBody PortfolioData.Profile profile) {
		if (profile.name == null || profile.name.isBlank() || profile.role == null || profile.role.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and role are required.");
		}
		if (!isAllowedFileUrl(profile.portrait) || !isAllowedFileUrl(profile.resumeUrl)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use an uploaded file or an HTTP(S) URL.");
		}
		try {
			store.updateProfile(profile);
			return profile;
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the profile.", exception);
		}
	}

	@PostMapping("/api/admin/dishes")
	public PortfolioData.Dish createDish(@Valid @RequestBody DishRequest request) {
		return saveDish(new PortfolioData.Dish(), request);
	}

	@PutMapping("/api/admin/dishes/{id}")
	public PortfolioData.Dish updateDish(@PathVariable String id, @Valid @RequestBody DishRequest request) {
		PortfolioData.Dish dish = new PortfolioData.Dish();
		dish.id = id;
		return saveDish(dish, request);
	}

	@DeleteMapping("/api/admin/dishes/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteDish(@PathVariable String id) {
		try {
			store.deleteDish(id);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not remove the dish.", exception);
		}
	}

	@PutMapping("/api/admin/dishes/{id}/signature")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void setSignatureDish(@PathVariable String id) {
		try {
			store.setSignatureDish(id);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not set the signature dish.", exception);
		}
	}

	@PutMapping("/api/admin/dishes/{id}/composition")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void setCompositionDish(@PathVariable String id) {
		try {
			store.setCompositionDish(id);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not set the plate composition dish.", exception);
		}
	}

	@PostMapping("/api/admin/experience")
	public PortfolioData.Experience createExperience(@RequestBody ExperienceRequest request) {
		return saveExperience(new PortfolioData.Experience(), request);
	}

	@PutMapping("/api/admin/experience/{id}")
	public PortfolioData.Experience updateExperience(@PathVariable String id, @RequestBody ExperienceRequest request) {
		PortfolioData.Experience experience = new PortfolioData.Experience();
		experience.id = id;
		return saveExperience(experience, request);
	}

	@DeleteMapping("/api/admin/experience/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteExperience(@PathVariable String id) {
		try {
			store.deleteExperience(id);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not remove the experience entry.", exception);
		}
	}

	@PostMapping(value = "/api/admin/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) {
		String extension = switch (file.getContentType() == null ? "" : file.getContentType()) {
			case "image/jpeg" -> ".jpg";
			case "image/png" -> ".png";
			case "image/webp" -> ".webp";
			default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload a JPEG, PNG, or WebP image.");
		};
		if (file.isEmpty() || file.getSize() > 8 * 1024 * 1024) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image smaller than 8 MB.");
		}
		return saveUpload(file, extension);
	}

	@PostMapping(value = "/api/admin/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public Map<String, String> uploadResume(@RequestParam("file") MultipartFile file) {
		try {
			byte[] contents = file.getBytes();
			if (!"application/pdf".equals(file.getContentType()) || contents.length < 5 || contents.length > 10 * 1024 * 1024
					|| contents[0] != '%' || contents[1] != 'P' || contents[2] != 'D' || contents[3] != 'F' || contents[4] != '-') {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload a valid PDF smaller than 10 MB.");
			}
			String filename = UUID.randomUUID() + ".pdf";
			Files.write(store.uploadDirectory().resolve(filename), contents);
			return Map.of("url", "/uploads/" + filename);
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the CV.", exception);
		}
	}

	private Map<String, String> saveUpload(MultipartFile file, String extension) {
		String filename = UUID.randomUUID() + extension;
		try {
			file.transferTo(store.uploadDirectory().resolve(filename));
			return Map.of("url", "/uploads/" + filename);
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the upload.", exception);
		}
	}

	private PortfolioData.Dish saveDish(PortfolioData.Dish dish, DishRequest request) {
		dish.title = request.title().trim();
		dish.cuisine = safe(request.cuisine());
		dish.description = safe(request.description());
		dish.image = safe(request.image());
		dish.imageFit = "contain".equals(request.imageFit()) ? "contain" : "cover";
		dish.sauce = safe(request.sauce());
		dish.protein = safe(request.protein());
		dish.herbs = safe(request.herbs());
		dish.garnish = safe(request.garnish());
		dish.texture = safe(request.texture());
		if (!isAllowedFileUrl(dish.image)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use an uploaded image or an HTTP(S) image URL.");
		}
		try {
			return store.saveDish(dish);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the dish.", exception);
		}
	}

	private PortfolioData.Experience saveExperience(PortfolioData.Experience entry, ExperienceRequest request) {
		if (request.venue() == null || request.venue().isBlank() || request.role() == null || request.role().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Venue and role are required.");
		}
		entry.venue = request.venue().trim();
		entry.role = request.role().trim();
		entry.location = safe(request.location());
		entry.dates = safe(request.dates());
		entry.details = safe(request.details());
		try {
			return store.saveExperience(entry);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, exception.getMessage());
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the experience entry.", exception);
		}
	}

	private boolean isAllowedFileUrl(String url) {
		return url == null || url.isBlank() || url.startsWith("/uploads/") || url.startsWith("/images/")
				|| url.startsWith("https://") || url.startsWith("http://");
	}

	private String safe(String value) {
		return value == null ? "" : value.trim();
	}

	public record DishRequest(@NotBlank String title, String cuisine, String description, @NotBlank String image,
			String imageFit, String sauce, String protein, String herbs, String garnish, String texture) { }
	public record ExperienceRequest(String venue, String role, String location, String dates, String details) { }
}
