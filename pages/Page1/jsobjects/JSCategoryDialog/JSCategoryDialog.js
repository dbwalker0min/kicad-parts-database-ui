export default {
	blank() {
		return { id: null, display_name: "", description: "", is_active: true };
	},

	ensureSelected() {
		if (!SelectCategory.selectedOptionValue) {
			showAlert("Pick a category first.", "warning"); 
			return false;
		}
		return true;
	},

	// When the Select changes, load that category into the form for editing
	loadForEdit() {
		const opt = SelectCategory.selectedOptionValue;
		if (!opt) return; // nothing selected
		const row = currentCategory.data[0]
		if (row) {
			InputDialogCatCategory.setValue(row.display_name ?? "");
			InputDialogCatDescription.setValue(row.description ?? "");
			CheckboxDialogCatActive.setValue(!!row.is_active);
		}
	},

	newCat() {
		// set your fields
		TextDialogCatTitle.setText("New Category")
		InputDialogCatCategory.setValue("");
		InputDialogCatDescription.setValue("");
		CheckboxDialogCatActive.setValue(true); // use setChecked for a Checkbox

		storeValue("catMode", "new");
		showModal(ModalCategoryForm.name);  
	},

	edit() {
		if (!this.ensureSelected()) return;
		TextDialogCatTitle.setText("Edit Category")

		storeValue("catMode", "edit");
		const row = getCategories.data.find(c => c.id === Number(SelectCategory.selectedOptionValue));
		if (!row) return showAlert("Could not load the selected category.", "error");
		InputDialogCatCategory.setValue(row.display_name);
		InputDialogCatDescription.setValue(row.description);
		CheckboxDialogCatActive.setValue(row.is_active);
		showModal(ModalCategoryForm.name);
	},

	askDelete() {
		if (!this.ensureSelected()) return;
		showModal(ModalConfirmDelete.name);
	},

	async save() {
		const mode = appsmith.store.catMode;

		if (!InputDialogCatCategory.text.trim()) {
			showAlert("Name is required.", "error");
			return;
		}

		try {
			if (mode === "new") {
				await createCategory.run();
			} else {
				await updateCategory.run();
			}
			closeModal(ModalCategoryForm.name);
			await getCategories.run();
			showAlert(mode === "new" ? "Category created." : "Category updated.", "success");
		} catch (e) {
			showAlert("A category with that name already exists.", "error");
			throw e;
		}
	},
	
	async confirmDelete() {
  	const row = getCategories.data.find(c => c.id === Number(SelectCategory.selectedOptionValue));

		InputDialogCatCategory.setValue(row.display_name);
		InputDialogCatDescription.setValue(row.description);
		CheckboxDialogCatActive.setValue(false);
		closeModal(ModalConfirmDelete.name);
		
		try {
			await updateCategory.run();
			SelectCategory.setSelectedOption(""); // clear selection after delete
			getCategories.run();
			showAlert("Category set inactive.", "success");
		} catch (e) {
			showAlert("Delete failed");
			throw e;
		}
	}
}
