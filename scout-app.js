// Senior Portrait Location & Pose Scout - Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // State management
  let currentView = 'gallery'; // 'gallery' or 'plan'
  let activeCategory = 'All';
  let activeVibe = 'All';
  let activeGender = 'female'; // Default to female portraits per user instruction
  let searchQuery = '';
  let activeModalItem = null;

  // Local storage state
  let pinnedIds = JSON.parse(localStorage.getItem('scout_pinned_ids') || '[]');
  let scoutNotes = JSON.parse(localStorage.getItem('scout_local_notes') || '{}');
  let scoutStatuses = JSON.parse(localStorage.getItem('scout_item_statuses') || '{}');

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

  // Modal DOM Elements
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-img');
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
  const jsonFileInput = document.getElementById('json-file-input');

  // Categories & Vibes derived from LOCATIONS_DATA
  const categories = ['All', ...new Set(LOCATIONS_DATA.map(item => item.category))];
  const vibes = ['All', ...new Set(LOCATIONS_DATA.map(item => item.vibe))];

  // Render Filter Chips
  function renderFilterChips() {
    categoryChipsContainer.innerHTML = '';
    categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `filter-chip ${cat === activeCategory ? 'active' : ''}`;
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

  // Update Pin Badge Counter
  function updateBadgeCounter() {
    planCounterBadge.textContent = pinnedIds.length;
  }

  // Filter Logic
  function getFilteredItems() {
    return LOCATIONS_DATA.filter(item => {
      const matchesGender = activeGender === 'all' || item.gender === activeGender;
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesVibe = activeVibe === 'All' || item.vibe === activeVibe;
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery) ||
        item.poseDescription.toLowerCase().includes(searchQuery) ||
        item.originalCaption.toLowerCase().includes(searchQuery) ||
        item.category.toLowerCase().includes(searchQuery);

      return matchesGender && matchesCategory && matchesVibe && matchesSearch;
    });
  }

  // Render Gallery Grid
  function renderGallery() {
    const items = getFilteredItems();
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
      const isPinned = pinnedIds.includes(item.id);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-img-wrapper" data-id="${item.id}">
          <img src="${item.imageLocalPath}" alt="${item.title}" class="card-img" loading="lazy">
          <div class="card-badges">
            <span class="badge-tag">${item.category}</span>
            <span class="badge-tag vibe">${item.vibe}</span>
          </div>
          <button class="pin-btn ${isPinned ? 'pinned' : ''}" data-id="${item.id}" title="${isPinned ? 'Unpin from Shoot Plan' : 'Pin to Shoot Plan'}">
            ${isPinned ? '★' : '☆'}
          </button>
        </div>
        <div class="card-content">
          <h3 class="card-title">${item.title}</h3>
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
    if (pinnedIds.includes(id)) {
      pinnedIds = pinnedIds.filter(item => item !== id);
    } else {
      pinnedIds.push(id);
    }
    localStorage.setItem('scout_pinned_ids', JSON.stringify(pinnedIds));
    updateBadgeCounter();
    renderGallery();
    if (currentView === 'plan') {
      renderShootPlan();
    }
  }

  // Open Lightbox Modal
  function openModal(item) {
    activeModalItem = item;
    modalImg.src = item.imageLocalPath;
    modalImg.alt = item.title;
    modalTitle.textContent = item.title;
    
    modalTags.innerHTML = `
      <span class="badge-tag">${item.category}</span>
      <span class="badge-tag vibe">${item.vibe}</span>
      <span class="badge-tag">${item.outfit}</span>
      <span class="badge-tag">${item.props}</span>
    `;

    modalPoseDesc.textContent = item.poseDescription;
    modalOriginalLoc.textContent = item.originalLocation;
    modalCaption.textContent = item.originalCaption;
    modalNotesArea.value = scoutNotes[item.id] || '';

    modalGmapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.googleMapsQuery)}`;

    const isPinned = pinnedIds.includes(item.id);
    modalPinBtn.textContent = isPinned ? '★ Pinned to Shoot Plan' : '☆ Pin to Shoot Plan';
    modalPinBtn.className = `btn-action ${isPinned ? 'active' : ''}`;

    modalOverlay.classList.add('open');
  }

  // Close Lightbox Modal
  function closeModal() {
    modalOverlay.classList.remove('open');
    activeModalItem = null;
  }

  // Auto-save Notes in Modal
  modalNotesArea.addEventListener('input', () => {
    if (activeModalItem) {
      scoutNotes[activeModalItem.id] = modalNotesArea.value;
      localStorage.setItem('scout_local_notes', JSON.stringify(scoutNotes));
    }
  });

  modalPinBtn.addEventListener('click', () => {
    if (activeModalItem) {
      togglePin(activeModalItem.id);
      const isPinned = pinnedIds.includes(activeModalItem.id);
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

  // Render Shoot Plan List
  function renderShootPlan() {
    planItemsList.innerHTML = '';
    const pinnedItems = LOCATIONS_DATA.filter(item => pinnedIds.includes(item.id));

    if (pinnedItems.length === 0) {
      planItemsList.innerHTML = `
        <div class="empty-state">
          <h3>Your Shoot Plan is empty</h3>
          <p>Click the star icon (☆) on any photo card to pin poses to your custom shot list!</p>
        </div>
      `;
      return;
    }

    pinnedItems.forEach((item, index) => {
      const userNote = scoutNotes[item.id] || '';
      const currentStatus = scoutStatuses[item.id] || 'Idea';

      const planCard = document.createElement('div');
      planCard.className = 'plan-item';
      planCard.innerHTML = `
        <img src="${item.imageLocalPath}" alt="${item.title}" class="plan-item-img">
        <div class="plan-item-info">
          <h4>${index + 1}. ${item.title} (${item.vibe})</h4>
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
        scoutStatuses[item.id] = e.target.value;
        localStorage.setItem('scout_item_statuses', JSON.stringify(scoutStatuses));
      });

      // Note Change Listener
      planCard.querySelector('.plan-item-note').addEventListener('input', (e) => {
        scoutNotes[item.id] = e.target.value;
        localStorage.setItem('scout_local_notes', JSON.stringify(scoutNotes));
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

  // Export Notes JSON
  exportJsonBtn.addEventListener('click', () => {
    const backupData = {
      pinnedIds,
      scoutNotes,
      scoutStatuses,
      exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `senior_portrait_shoot_plan_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Import Notes JSON
  importJsonBtn.addEventListener('click', () => jsonFileInput.click());
  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.pinnedIds) pinnedIds = imported.pinnedIds;
        if (imported.scoutNotes) scoutNotes = imported.scoutNotes;
        if (imported.scoutStatuses) scoutStatuses = imported.scoutStatuses;

        localStorage.setItem('scout_pinned_ids', JSON.stringify(pinnedIds));
        localStorage.setItem('scout_local_notes', JSON.stringify(scoutNotes));
        localStorage.setItem('scout_item_statuses', JSON.stringify(scoutStatuses));

        updateBadgeCounter();
        renderGallery();
        if (currentView === 'plan') renderShootPlan();
        alert('Shoot Plan & Notes imported successfully!');
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  });

  // Initializing App
  renderFilterChips();
  updateBadgeCounter();
  renderGallery();
});
