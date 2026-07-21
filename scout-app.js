// Senior Portrait Location & Pose Scout - Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // State management
  let currentView = 'gallery'; // 'gallery' or 'plan'
  let activeCategory = 'All';
  let activeVibe = 'All';
  let activeGender = 'female'; // Default to female portraits per user instruction
  let searchQuery = '';
  let activeModalItem = null;
  let isZoomed = false;

  // --- Multi-Plan Storage & Migration System ---
  let plansStore = JSON.parse(localStorage.getItem('scout_plans_store_v1') || 'null');

  // Migrate legacy storage if store doesn't exist
  if (!plansStore) {
    const legacyPinned = JSON.parse(localStorage.getItem('scout_pinned_ids') || '[]');
    const legacyNotes = JSON.parse(localStorage.getItem('scout_local_notes') || '{}');
    const legacyStatuses = JSON.parse(localStorage.getItem('scout_item_statuses') || '{}');

    plansStore = {
      activePlanName: "Maddie's Senior Shoot",
      plans: {
        "Maddie's Senior Shoot": {
          name: "Maddie's Senior Shoot",
          updatedAt: new Date().toISOString(),
          pinnedIds: legacyPinned,
          scoutNotes: legacyNotes,
          scoutStatuses: legacyStatuses
        }
      }
    };
    savePlansStore();
  }

  // Helper getters for active plan
  function getActivePlan() {
    if (!plansStore.plans[plansStore.activePlanName]) {
      const keys = Object.keys(plansStore.plans);
      plansStore.activePlanName = keys.length > 0 ? keys[0] : "My Senior Shoot Plan";
      if (!plansStore.plans[plansStore.activePlanName]) {
        plansStore.plans[plansStore.activePlanName] = {
          name: plansStore.activePlanName,
          updatedAt: new Date().toISOString(),
          pinnedIds: [],
          scoutNotes: {},
          scoutStatuses: {}
        };
      }
    }
    return plansStore.plans[plansStore.activePlanName];
  }

  function savePlansStore() {
    localStorage.setItem('scout_plans_store_v1', JSON.stringify(plansStore));
  }

  // Toast Notification Helper
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // DOM Elements
  const galleryGrid = document.getElementById('gallery-grid');
  const searchInput = document.getElementById('search-input');
  const categoryChipsContainer = document.getElementById('category-chips');
  const vibeChipsContainer = document.getElementById('vibe-chips');
  const genderToggleBtn = document.getElementById('gender-toggle-btn');
  const viewGalleryBtn = document.getElementById('view-gallery-btn');
  const viewPlanBtn = document.getElementById('view-plan-btn');
  const planCounterBadge = document.getElementById('plan-counter');
  const gallerySection = document.getElementById('gallery-section');
  const shootPlanSection = document.getElementById('shoot-plan-section');
  const planItemsList = document.getElementById('plan-items-list');

  // Plan selector DOM Elements
  const planSelect = document.getElementById('plan-select');
  const newPlanBtn = document.getElementById('new-plan-btn');
  const renamePlanBtn = document.getElementById('rename-plan-btn');
  const deletePlanBtn = document.getElementById('delete-plan-btn');

  // Modal DOM Elements
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImgWrapper = document.getElementById('modal-img-wrapper-zoom');
  const modalImg = document.getElementById('modal-img');
  const zoomToggleBtn = document.getElementById('zoom-toggle-btn');
  const openFullResBtn = document.getElementById('open-full-res-btn');

  const modalTitle = document.getElementById('modal-title');
  const modalTags = document.getElementById('modal-tags');
  const modalPoseDesc = document.getElementById('modal-pose-desc');
  const modalOriginalLoc = document.getElementById('modal-original-loc');
  const modalCaption = document.getElementById('modal-caption');
  const modalNotesArea = document.getElementById('modal-notes-area');
  const modalGmapsBtn = document.getElementById('modal-gmaps-btn');
  const modalPinBtn = document.getElementById('modal-pin-btn');

  // Buttons
  const printPlanBtn = document.getElementById('print-plan-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const importJsonBtn = document.getElementById('import-json-btn');
  const shareCodeBtn = document.getElementById('share-code-btn');
  const jsonFileInput = document.getElementById('json-file-input');

  // Categories & Vibes derived from LOCATIONS_DATA
  const categories = ['All', '⭐ Local Parker & Hood Co.', ...new Set(LOCATIONS_DATA.map(item => item.category))];
  const vibes = ['All', ...new Set(LOCATIONS_DATA.map(item => item.vibe))];

  // Render Filter Chips
  function renderFilterChips() {
    categoryChipsContainer.innerHTML = '';
    categories.forEach(cat => {
      const chip = document.createElement('button');
      const isLocalChip = cat === '⭐ Local Parker & Hood Co.';
      chip.className = `filter-chip ${cat === activeCategory ? 'active' : ''} ${isLocalChip ? 'chip-gender' : ''}`;
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        activeCategory = cat;
        renderFilterChips();
        renderGallery();
      });
      categoryChipsContainer.appendChild(chip);
    });

    vibeChipsContainer.innerHTML = '';
    vibes.forEach(vibe => {
      const chip = document.createElement('button');
      chip.className = `filter-chip ${vibe === activeVibe ? 'active' : ''}`;
      chip.textContent = vibe;
      chip.addEventListener('click', () => {
        activeVibe = vibe;
        renderFilterChips();
        renderGallery();
      });
      vibeChipsContainer.appendChild(chip);
    });
  }

  // Render Plan Select Dropdown
  function renderPlanSelector() {
    planSelect.innerHTML = '';
    Object.keys(plansStore.plans).forEach(planName => {
      const option = document.createElement('option');
      option.value = planName;
      option.textContent = `${planName} (${plansStore.plans[planName].pinnedIds.length} poses)`;
      if (planName === plansStore.activePlanName) {
        option.selected = true;
      }
      planSelect.appendChild(option);
    });
  }

  // Update Pin Badge Counter
  function updateBadgeCounter() {
    const currentPlan = getActivePlan();
    planCounterBadge.textContent = currentPlan.pinnedIds.length;
  }

  // Filter Logic
  function getFilteredItems() {
    return LOCATIONS_DATA.filter(item => {
      const matchesGender = activeGender === 'all' || item.gender === activeGender;
      let matchesCategory = true;

      if (activeCategory === '⭐ Local Parker & Hood Co.') {
        matchesCategory = item.isLocalSpot === true;
      } else if (activeCategory !== 'All') {
        matchesCategory = item.category === activeCategory;
      }

      const matchesVibe = activeVibe === 'All' || item.vibe === activeVibe;
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery) ||
        item.poseDescription.toLowerCase().includes(searchQuery) ||
        item.originalCaption.toLowerCase().includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery) ||
        item.originalLocation.toLowerCase().includes(searchQuery);

      return matchesGender && matchesCategory && matchesVibe && matchesSearch;
    });
  }

  // Render Gallery Grid
  function renderGallery() {
    const items = getFilteredItems();
    const currentPlan = getActivePlan();
    galleryGrid.innerHTML = '';

    if (items.length === 0) {
      galleryGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No poses found matching criteria</h3>
          <p>Try clearing your search query or switching filter tags.</p>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const isPinned = currentPlan.pinnedIds.includes(item.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-img-wrapper" data-id="${item.id}">
          <img src="${item.imageLocalPath}" alt="${item.title}" class="card-img" loading="lazy">
          <div class="card-badges">
            ${item.isLocalSpot ? '<span class="badge-tag local-star-badge">⭐ Parker & Hood Co. Spot</span>' : ''}
            <span class="badge-tag">${item.category}</span>
            <span class="badge-tag vibe">${item.vibe}</span>
          </div>
          <button class="pin-btn ${isPinned ? 'pinned' : ''}" data-id="${item.id}" title="${isPinned ? 'Unpin from Shoot Plan' : 'Pin to Shoot Plan'}">
            ${isPinned ? '★' : '☆'}
          </button>
        </div>
        <div class="card-content">
          <h3 class="card-title">${item.isLocalSpot ? '⭐ ' : ''}${item.title}</h3>
          <p class="card-desc">${item.poseDescription}</p>
          <div class="card-footer">
            <button class="btn-details" data-id="${item.id}">Inspect Pose & Local Notes ➔</button>
          </div>
        </div>
      `;

      // Event Listeners for Card
      card.querySelector('.card-img-wrapper').addEventListener('click', (e) => {
        if (!e.target.classList.contains('pin-btn')) {
          openModal(item);
        }
      });
      card.querySelector('.btn-details').addEventListener('click', () => openModal(item));
      
      const pinBtn = card.querySelector('.pin-btn');
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePin(item.id);
      });

      galleryGrid.appendChild(card);
    });
  }

  // Toggle Pin Action
  function togglePin(id) {
    const plan = getActivePlan();
    if (plan.pinnedIds.includes(id)) {
      plan.pinnedIds = plan.pinnedIds.filter(item => item !== id);
    } else {
      plan.pinnedIds.push(id);
    }
    plan.updatedAt = new Date().toISOString();
    savePlansStore();
    renderPlanSelector();
    updateBadgeCounter();
    renderGallery();
    if (currentView === 'plan') {
      renderShootPlan();
    }
  }

  // Open Lightbox Modal
  function openModal(item) {
    activeModalItem = item;
    resetZoom();

    modalImg.src = item.imageLocalPath;
    modalImg.alt = item.title;
    openFullResBtn.href = item.imageLocalPath;

    modalTitle.textContent = (item.isLocalSpot ? '⭐ ' : '') + item.title;
    
    modalTags.innerHTML = `
      ${item.isLocalSpot ? '<span class="badge-tag local-star-badge">⭐ Local Parker & Hood Co. Spot</span>' : ''}
      <span class="badge-tag">${item.category}</span>
      <span class="badge-tag vibe">${item.vibe}</span>
      <span class="badge-tag">${item.outfit}</span>
      <span class="badge-tag">${item.props}</span>
    `;

    modalPoseDesc.textContent = item.poseDescription;
    modalOriginalLoc.textContent = item.originalLocation;
    modalCaption.textContent = item.originalCaption;

    const plan = getActivePlan();
    modalNotesArea.value = plan.scoutNotes[item.id] || '';

    modalGmapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}`;

    const isPinned = plan.pinnedIds.includes(item.id);
    modalPinBtn.textContent = isPinned ? '★ Pinned to Shoot Plan' : '☆ Pin to Shoot Plan';
    modalPinBtn.className = `btn-action ${isPinned ? 'active' : ''}`;

    modalOverlay.classList.add('open');
  }

  // Zoom & Pan Functions
  function toggleZoom(e) {
    isZoomed = !isZoomed;
    if (isZoomed) {
      modalImg.classList.add('zoomed-in');
      modalImgWrapper.classList.add('is-zoomed');
      zoomToggleBtn.textContent = '🔍 Zoom Out (1x)';
      if (e && e.clientX && e.clientY) {
        panToPosition(e);
      }
    } else {
      resetZoom();
    }
  }

  function resetZoom() {
    isZoomed = false;
    modalImg.classList.remove('zoomed-in');
    modalImgWrapper.classList.remove('is-zoomed');
    modalImg.style.transformOrigin = 'center center';
    zoomToggleBtn.textContent = '🔍 Zoom In (2.5x)';
  }

  function panToPosition(e) {
    if (!isZoomed) return;
    const rect = modalImgWrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    modalImg.style.transformOrigin = `${x}% ${y}%`;
  }

  modalImgWrapper.addEventListener('click', toggleZoom);
  zoomToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleZoom();
  });

  modalImgWrapper.addEventListener('mousemove', (e) => {
    if (isZoomed) {
      panToPosition(e);
    }
  });

  // Close Lightbox Modal
  function closeModal() {
    modalOverlay.classList.remove('open');
    activeModalItem = null;
    resetZoom();
  }

  // Auto-save Notes in Modal
  modalNotesArea.addEventListener('input', () => {
    if (activeModalItem) {
      const plan = getActivePlan();
      plan.scoutNotes[activeModalItem.id] = modalNotesArea.value;
      plan.updatedAt = new Date().toISOString();
      savePlansStore();
    }
  });

  modalPinBtn.addEventListener('click', () => {
    if (activeModalItem) {
      togglePin(activeModalItem.id);
      const plan = getActivePlan();
      const isPinned = plan.pinnedIds.includes(activeModalItem.id);
      modalPinBtn.textContent = isPinned ? '★ Pinned to Shoot Plan' : '☆ Pin to Shoot Plan';
    }
  });

  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Search input event
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderGallery();
  });

  // Gender Toggle
  genderToggleBtn.addEventListener('click', () => {
    if (activeGender === 'female') {
      activeGender = 'all';
      genderToggleBtn.textContent = 'Gender: Showing All (F & M)';
    } else {
      activeGender = 'female';
      genderToggleBtn.textContent = 'Gender: Female Only';
    }
    renderGallery();
  });

  // View Switching
  viewGalleryBtn.addEventListener('click', () => {
    currentView = 'gallery';
    viewGalleryBtn.classList.add('active');
    viewPlanBtn.classList.remove('active');
    gallerySection.style.display = 'block';
    shootPlanSection.classList.remove('active');
  });

  viewPlanBtn.addEventListener('click', () => {
    currentView = 'plan';
    viewPlanBtn.classList.add('active');
    viewGalleryBtn.classList.remove('active');
    gallerySection.style.display = 'none';
    shootPlanSection.classList.add('active');
    renderShootPlan();
  });

  // --- PLAN MANAGEMENT EVENT LISTENERS ---

  // Switch Active Plan
  planSelect.addEventListener('change', (e) => {
    plansStore.activePlanName = e.target.value;
    savePlansStore();
    updateBadgeCounter();
    renderGallery();
    renderShootPlan();
    showToast(`Switched active plan to: "${plansStore.activePlanName}"`);
  });

  // Create New Plan
  newPlanBtn.addEventListener('click', () => {
    const planName = prompt('Enter a name for the new Shoot Plan (e.g., "Granbury Sunset Shoot"):');
    if (!planName || !planName.trim()) return;

    const trimmed = planName.trim();
    if (plansStore.plans[trimmed]) {
      showToast(`A shoot plan named "${trimmed}" already exists.`, 'error');
      plansStore.activePlanName = trimmed;
    } else {
      plansStore.plans[trimmed] = {
        name: trimmed,
        updatedAt: new Date().toISOString(),
        pinnedIds: [],
        scoutNotes: {},
        scoutStatuses: {}
      };
      plansStore.activePlanName = trimmed;
      showToast(`Created new shoot plan: "${trimmed}"`);
    }

    savePlansStore();
    renderPlanSelector();
    updateBadgeCounter();
    renderGallery();
    renderShootPlan();
  });

  // Rename Current Plan
  renamePlanBtn.addEventListener('click', () => {
    const currentName = plansStore.activePlanName;
    const newName = prompt(`Rename shoot plan "${currentName}" to:`, currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;

    const trimmed = newName.trim();
    const planData = plansStore.plans[currentName];
    delete plansStore.plans[currentName];

    planData.name = trimmed;
    planData.updatedAt = new Date().toISOString();
    plansStore.plans[trimmed] = planData;
    plansStore.activePlanName = trimmed;

    savePlansStore();
    renderPlanSelector();
    showToast(`Renamed plan to: "${trimmed}"`);
  });

  // Delete Current Plan
  deletePlanBtn.addEventListener('click', () => {
    const currentName = plansStore.activePlanName;
    const planKeys = Object.keys(plansStore.plans);

    if (planKeys.length <= 1) {
      showToast('Cannot delete the only remaining shoot plan.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete the shoot plan "${currentName}"?`)) return;

    delete plansStore.plans[currentName];
    plansStore.activePlanName = Object.keys(plansStore.plans)[0];

    savePlansStore();
    renderPlanSelector();
    updateBadgeCounter();
    renderGallery();
    renderShootPlan();
    showToast(`Deleted plan "${currentName}". Active plan is now "${plansStore.activePlanName}".`);
  });

  // Render Shoot Plan List
  function renderShootPlan() {
    planItemsList.innerHTML = '';
    const plan = getActivePlan();
    const pinnedItems = LOCATIONS_DATA.filter(item => plan.pinnedIds.includes(item.id));

    if (pinnedItems.length === 0) {
      planItemsList.innerHTML = `
        <div class="empty-state">
          <h3>"${plan.name}" is currently empty</h3>
          <p>Click the star icon (☆) on any photo card in the gallery to pin poses to this shot list!</p>
        </div>
      `;
      return;
    }

    pinnedItems.forEach((item, index) => {
      const userNote = plan.scoutNotes[item.id] || '';
      const currentStatus = plan.scoutStatuses[item.id] || 'Idea';

      const planCard = document.createElement('div');
      planCard.className = 'plan-item';
      planCard.innerHTML = `
        <img src="${item.imageLocalPath}" alt="${item.title}" class="plan-item-img">
        <div class="plan-item-info">
          <h4>${index + 1}. ${item.isLocalSpot ? '⭐ ' : ''}${item.title} (${item.vibe})</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${item.poseDescription}</p>
          <div style="margin-top: 6px;">
            <label style="font-size: 0.8rem; font-weight: bold; color: var(--accent-teal);">Local Re-creation Spot & Notes:</label>
            <textarea class="scout-notes-textarea plan-item-note" data-id="${item.id}" placeholder="Note local equivalent spot, address, time of day...">${userNote}</textarea>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
          <select class="status-select" data-id="${item.id}">
            <option value="Idea" ${currentStatus === 'Idea' ? 'selected' : ''}>💡 Idea</option>
            <option value="Found Spot" ${currentStatus === 'Found Spot' ? 'selected' : ''}>📍 Spot Found</option>
            <option value="Planned" ${currentStatus === 'Planned' ? 'selected' : ''}>📅 Planned</option>
            <option value="Done" ${currentStatus === 'Done' ? 'selected' : ''}>✅ Shot Recreated</option>
          </select>
          <button class="btn-action unpin-item-btn" data-id="${item.id}" style="color: var(--accent-red);">Remove</button>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}" target="_blank" class="btn-gmaps" style="font-size:0.75rem; padding:4px 8px;">Find Local Spot ↗</a>
        </div>
      `;

      // Status Change Listener
      planCard.querySelector('.status-select').addEventListener('change', (e) => {
        plan.scoutStatuses[item.id] = e.target.value;
        plan.updatedAt = new Date().toISOString();
        savePlansStore();
      });

      // Note Change Listener
      planCard.querySelector('.plan-item-note').addEventListener('input', (e) => {
        plan.scoutNotes[item.id] = e.target.value;
        plan.updatedAt = new Date().toISOString();
        savePlansStore();
      });

      // Unpin Listener
      planCard.querySelector('.unpin-item-btn').addEventListener('click', () => {
        togglePin(item.id);
      });

      planItemsList.appendChild(planCard);
    });
  }

  // Print Plan
  printPlanBtn.addEventListener('click', () => {
    window.print();
  });

  // Export Plan JSON File (To Share with Daughter / Dad)
  exportJsonBtn.addEventListener('click', () => {
    const plan = getActivePlan();

    // Embed rich location metadata into exported file so it is human readable in any JSON viewer
    const exportedItems = LOCATIONS_DATA.filter(item => plan.pinnedIds.includes(item.id)).map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      vibe: item.vibe,
      outfit: item.outfit,
      props: item.props,
      isLocalSpot: item.isLocalSpot,
      poseDescription: item.poseDescription,
      originalLocation: item.originalLocation,
      userNote: plan.scoutNotes[item.id] || '',
      status: plan.scoutStatuses[item.id] || 'Idea'
    }));

    const exportData = {
      app: "SeniorPortraitScout",
      version: "1.0",
      planName: plan.name,
      exportedAt: new Date().toISOString(),
      pinnedIds: plan.pinnedIds,
      scoutNotes: plan.scoutNotes,
      scoutStatuses: plan.scoutStatuses,
      itemsSummary: exportedItems
    };

    const safeFileName = plan.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `shoot_plan_${safeFileName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`Exported "${plan.name}" file! You can now text or email this file.`);
  });

  // Import Plan JSON File (OVERRIDE EXISTING PLAN WITH SAME NAME TO PREVENT RUNAWAYS)
  importJsonBtn.addEventListener('click', () => jsonFileInput.click());
  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const planName = imported.planName || imported.name || file.name.replace(/\.(json|scout)/gi, '');

        const importedPinned = Array.isArray(imported.pinnedIds) ? imported.pinnedIds : [];
        const importedNotes = imported.scoutNotes || {};
        const importedStatuses = imported.scoutStatuses || {};

        const isOverride = !!plansStore.plans[planName];

        // Override or Save new plan under this name
        plansStore.plans[planName] = {
          name: planName,
          updatedAt: new Date().toISOString(),
          pinnedIds: importedPinned,
          scoutNotes: importedNotes,
          scoutStatuses: importedStatuses
        };
        plansStore.activePlanName = planName;
        savePlansStore();

        renderPlanSelector();
        updateBadgeCounter();
        renderGallery();
        if (currentView === 'plan') renderShootPlan();

        if (isOverride) {
          showToast(`Overrode existing plan "${planName}" with imported data (${importedPinned.length} poses)!`);
        } else {
          showToast(`Successfully imported new shoot plan "${planName}" (${importedPinned.length} poses)!`);
        }

        // Reset file input
        jsonFileInput.value = '';
      } catch (err) {
        showToast('Error reading file. Please provide a valid .json shoot plan file.', 'error');
      }
    };
    reader.readAsText(file);
  });

  // Copy Text Summary to Clipboard (Quick Text/Email Option)
  shareCodeBtn.addEventListener('click', () => {
    const plan = getActivePlan();
    const pinnedItems = LOCATIONS_DATA.filter(item => plan.pinnedIds.includes(item.id));

    if (pinnedItems.length === 0) {
      showToast('Your active shoot plan has no pinned poses to share.', 'error');
      return;
    }

    let summaryText = `📸 SENIOR PORTRAIT SHOOT PLAN: "${plan.name}"\n`;
    summaryText += `Total Poses: ${pinnedItems.length}\n`;
    summaryText += `------------------------------------\n`;

    pinnedItems.forEach((item, idx) => {
      summaryText += `${idx + 1}. ${item.isLocalSpot ? '⭐ ' : ''}${item.title} (${item.vibe} / ${item.category})\n`;
      if (plan.scoutNotes[item.id]) {
        summaryText += `   Note: ${plan.scoutNotes[item.id]}\n`;
      }
    });

    summaryText += `\nExported from Senior Portrait Scout App.`;

    navigator.clipboard.writeText(summaryText).then(() => {
      showToast(`Copied text summary of "${plan.name}" to clipboard!`);
    }).catch(() => {
      showToast('Copied summary text to clipboard.');
    });
  });

  // Initializing App
  renderFilterChips();
  renderPlanSelector();
  updateBadgeCounter();
  renderGallery();
});
