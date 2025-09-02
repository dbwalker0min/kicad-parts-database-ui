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

  onButtonClick(label) {
    switch ((label || "").toLowerCase()) {
      case "new":    return this.new();
      case "edit":   return this.edit();
      case "delete": return this.askDelete();
    }
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
		console.log("New…");
    // (optional) reset modal & its children first
    resetWidget("ModalCategoryForm", true);

    // set your fields
    InputDialogCatCategory.setValue("");
    InputDialogCatDescription.setValue("");
    CheckboxDialogCatActive.setValue(true); // use setChecked for a Checkbox

    storeValue("catMode", "new");
    showModal("ModalCategoryForm");  
  },

  edit() {
    if (!this.ensureSelected()) return;
    storeValue("catMode", "edit");
    const row = getCategories.data.find(c => c.id === Number(SelectCategory.selectedOptionValue));
    if (!row) return showAlert("Could not load the selected category.", "error");
    showModal(ModalCategoryForm.name);
  },

  askDelete() {
    if (!this.ensureSelected()) return;
    showModal("Modal_ConfirmDelete");
  },

  async save() {
    const mode = appsmith.store.catMode || (CategoryForm.data?.id ? "edit" : "new");
    const d = CategoryForm.data;

    if (!d.display_name?.trim()) {
      showAlert("Name is required.", "error");
      return;
    }

    try {
      if (mode === "new") {
        const res = await createCategory.run();
        // optionally select the new category
        SelectCategory.setSelectedOption(String(res[0].id));
      } else {
        await updateCategory.run();
      }
      closeModal("Modal_Category");
      await getCategories.run();
      showAlert(mode === "new" ? "Category created." : "Category updated.", "success");
    } catch (e) {
      const msg = (createCategory.isError ? createCategory.error : updateCategory.error) || (""+e);
      if (msg.toLowerCase().includes("unique")) {
        showAlert("A category with that name already exists.", "error");
      } else {
        showAlert("Save failed: " + msg, "error");
      }
      throw e;
    }
  },

  async confirmDelete() {
    try {
      await softDeleteCategory.run();
      closeModal("Modal_ConfirmDelete");
      await getCategories.run();
      SelectCategory.setSelectedOption(""); // clear selection after delete
      showAlert("Category set inactive.", "success");
    } catch (e) {
      showAlert("Delete failed: " + softDeleteCategory.error, "error");
      throw e;
    }
  }
}
