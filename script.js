let menu_name;
let menu_slots_amount;

document.addEventListener('DOMContentLoaded', () => {
    var inventory = document.getElementById('inventory-texture');
    inventory.querySelector('embed').addEventListener('load', () => {
        setInventorySlots(9)

        var inventory = document.getElementById('inventory');
        var embed = inventory.querySelector('embed');

        var svgDoc = embed.getSVGDocument();

        var svg = svgDoc.querySelector('svg');
        var item_row = svg.querySelector('.item_row');

        addItemSlots(item_row.querySelectorAll('foreignObject'));
        setMenuTitle("Menu");
        setupListener();
    });
    loadItemImages();
});

function loadItemImages() {
    fetch('images/items_1.21/item_list.json')
        .then(response => response.json())
        .then(files => {
            const item_browser = document.getElementById('item_container');

            files.forEach(file => {
                const div = document.createElement('div');
                div.classList.add("item");
                const img = document.createElement('img');

                img.src = `images/items_1.21/${file}`
                div.id = file.substring(0, file.lastIndexOf('.'));
                img.alt = file;
                div.setAttribute('draggable', true);

                div.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text', e.target.id);
                    e.dataTransfer.setDragImage(img, img.getBoundingClientRect().width / 2, img.getBoundingClientRect().height / 2);
                    div.style.opacity = 0.5;
                });

                div.addEventListener('dragend', () => {
                    div.style.opacity = 1;
                })

                div.appendChild(img);
                item_browser.appendChild(div);
            }
            )
        }
        )
}

function setInventorySlots(amount) {
    menu_slots_amount = amount;
    var inventory = document.getElementById('inventory');
    var embed = inventory.querySelector('embed');

    var svgDoc = embed.getSVGDocument();

    var svg = svgDoc.querySelector('svg');
    var item_row = svg.querySelector('.item_row');

    var bottom_border = svg.getElementById('bottom_border')
    var top_border = svg.getElementById('top_border');

    var item_rows = svg.querySelectorAll('.item_row');

    let previousRowsAmt = item_rows.length;
    let rowsDiff = amount / 9 - previousRowsAmt;

    if (rowsDiff > 0) {
        for (let i = 1; i < rowsDiff + 1; i++) {
            var newRow = item_row.cloneNode(true);

            moveSvgGroupTo(newRow, 0, item_row.getBBox().y + 2 + item_row.getBBox().height * (svg.querySelectorAll('.item_row').length - 1));

            svg.appendChild(newRow);

            addItemSlots(newRow.querySelectorAll('foreignObject'));
        }
    } else if (rowsDiff < 0) {
        let slot_rows = document.querySelectorAll('.slot-row')
        for (let i = amount / 9; i < item_rows.length; i++) {
            svg.removeChild(item_rows[i]);
            slot_rows[i].remove();
        }
    }
    moveSvgGroupTo(bottom_border, svg.getBBox().x, svg.getBBox().y + top_border.getBBox().height + item_row.getBBox().height * svg.querySelectorAll('.item_row').length - 2);

    if (menuFilling) {
        setMenuFilling(menuFilling.dataset.material);
    }

    let svgWidth = parseFloat(svg.getAttribute('width'));
    let newHeight = svg.getBBox().height;
    svg.setAttribute('height', newHeight);

    // Update the viewBox to accommodate the new height
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${newHeight}`);
}

function addItemProperties(element, material, lore, name, amount, hideAttributes, glint, hideTooltip, headTexture, renderType, itemType, lorePages) {
    element.id = crypto.randomUUID();

    element.dataset.material = material;

    if (!element.dataset.lore) {
        element.dataset.lore = JSON.stringify(lore);
    }
    if (!element.dataset.name) {
        setItemName(element, name);
    }
    if (!element.dataset.amount) {
        element.dataset.amount = amount;
    }
    if (!element.dataset.renderType) {
        element.dataset.renderType = renderType;
    }
    if (!element.dataset.hide_attributes) {
        element.dataset.hide_attributes = hideAttributes.toString();
    }
    if (!element.dataset.glint) {
        element.dataset.glint = glint.toString();
    }
    if (!element.dataset.hide_tooltip) {
        element.dataset.hide_tooltip = hideTooltip.toString();
    }
    if (!element.dataset.itemType) {
        element.dataset.itemType = itemType;
    }
    if (material.toUpperCase() === 'PLAYER_HEAD') {
        // If headTexture is null or undefined, set it to the string "null", otherwise set it to its value
        element.dataset.headTexture = headTexture === null || headTexture === undefined || headTexture === '' ? null : headTexture;
    }
    if (itemType == 'paginated') {
        element.dataset.lorePages = lorePages;
    }

    if (element.querySelector('.item-slot-amount') == null) {
        const amount = document.createElement('span');
        amount.classList.add('item-slot-amount');
        element.appendChild(amount);
    }
}

function addItemSlots(foreignObjects) {
    const row = document.createElement('div');
    row.classList.add('slot-row');
    foreignObjects.forEach(foreignObject => {
        const div = document.createElement('div');
        div.classList.add('item_slot');
        div.style.position = 'absolute';
        div.style.left = foreignObject.getBoundingClientRect().x + 'px';
        div.style.top = foreignObject.getBoundingClientRect().y + 'px';
        div.style.width = foreignObject.getBoundingClientRect().width + 'px';
        div.style.height = foreignObject.getBoundingClientRect().height + 'px';
        div.setAttribute('draggable', true);

        div.addEventListener('click', (e) => itemSlotClick(e.target));

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        div.addEventListener('mousemove', (e) => {
            let item = e.target.querySelector('.item');
            if (item && item.dataset.hide_tooltip == 'false' && !pinLore) {
                let tooltip = document.getElementById('tooltip-div');
                let dx = tooltip.parentElement.getBoundingClientRect().x;
                let dy = tooltip.parentElement.getBoundingClientRect().y;

                tooltip.style.display = 'block';
                tooltip.style.top = e.clientY - 48 - dy + "px";
                tooltip.style.left = e.clientX - dx + 24 + "px";

                if (item) {
                    setTooltipText(item.dataset.name, item.dataset.lore);
                }
            }
        });
        div.addEventListener('mouseleave', (e) => {
            let item = e.target.querySelector('.item');
            if (item && item.dataset.hide_tooltip == 'false' && !pinLore) {
                let tooltip = document.getElementById('tooltip-div');
                tooltip.style.display = 'none';
            }
        });

        div.addEventListener('drop', (e) => {
            e.preventDefault();

            const draggedElementId = e.dataTransfer.getData('text');
            const draggedElement = document.getElementById(draggedElementId).cloneNode(true);

            if (e.target.querySelector('.fill')) {
                e.target.querySelector('.fill').remove();
            }
            if (!e.target.querySelector('.item') && !draggedElement.dataset.name) {
                div.appendChild(draggedElement);
            } else if (e.target.querySelector('.item') && !draggedElement.dataset.name) {
                e.target.querySelector('img').replaceWith(draggedElement.querySelector('img'));
            } else if (e.target.querySelector('.item') && draggedElement.dataset.name) {
                e.target.querySelector('.item').replaceWith(draggedElement);
            } else {
                div.appendChild(draggedElement);
            }
            if (e.target.getAttribute('draggable') == 'false') {
                e.target.setAttribute('draggable', true);
            }

            let item = e.target.querySelector('.item');

            item.id = crypto.randomUUID();

            let material = item.querySelector('img').alt;

            addItemProperties(item,
                material.substring(0, material.lastIndexOf('.')).toUpperCase(),
                [],
                '',
                1,
                false,
                false,
                false,
                null,
                'unset',
                'normal');

            draggedElement.style.opacity = 1;

        });
        div.addEventListener('dragstart', (e) => {
            const img = e.target.querySelector('img');
            e.dataTransfer.setDragImage(img, img.getBoundingClientRect().width / 2, img.getBoundingClientRect().height / 2);
            document.getElementById('tooltip-div').style.display = 'none';
            const item = e.target.querySelector('.item');
            if (item) {
                e.dataTransfer.setData('text', item.id);
                closeSlotCustomizer();
            }
        });
        div.addEventListener('dragend', (e) => {
            let item = e.target;
            if (menuFilling == null) {
                item.querySelector('.item').remove();
            } else if (menuFilling != null) {
                item.querySelector('.item').replaceWith(menuFilling.cloneNode(true));
            }
        });

        row.appendChild(div);
    });
    let slots_container = document.getElementById('item_slots_container');
    slots_container.appendChild(row);

    let item_slots = Array.from(slots_container.querySelectorAll('.item_slot'));
    item_slots.forEach(slot => {
        slot.dataset.slot = item_slots.indexOf(slot);
    });
}

let timeOut;

function showPopUpError(text) {
    if (timeOut) {
        clearTimeout(timeOut);
    }
    const errorWindow = document.getElementById('pop-up-error');
    errorWindow.querySelector('span').innerHTML = text;
    errorWindow.classList.remove('closing');
    errorWindow.classList.add('open');
    timeOut = setTimeout(() => {
        errorWindow.classList.remove('open');
        errorWindow.classList.add('closing');
    }, 2000);
}

function itemSlotClick(target) {
    if (!target.querySelector('.item')) {
        showPopUpError('Item slot contains no item')
        closeSlotCustomizer();
        return;
    }
    document.querySelectorAll('.active-slot').forEach(element => {
        element.classList.remove('active-slot');
    });
    target.classList.add('active-slot');
    openSlotCustomizer(target);
}

function openSlotCustomizer(target) {
    let item = target.querySelector('.item');
    var right_sidebar = document.querySelector('.right-sidebar');
    right_sidebar.style.display = "grid";
    right_sidebar.querySelector('.slot_customizer-title').innerHTML = `Slot #${target.dataset.slot}`;
    right_sidebar.querySelector('#amount_input').value = item.dataset.amount;
    loadLorePages(item);
    right_sidebar.querySelector('#name_input').value = item.dataset.name;
    right_sidebar.querySelector('#id_showcase').querySelector('#item_id').innerHTML = createIdFromString(item.dataset.name);
    right_sidebar.querySelector('#hide_attributes').checked = item.dataset.hide_attributes === "true";
    right_sidebar.querySelector('#glint_input').checked = item.dataset.glint === "true";
    right_sidebar.querySelector('#hide_tooltip').checked = item.dataset.hide_tooltip === "true";
    right_sidebar.querySelector('#player_head_input').value = item.dataset.headTexture;
    setTooltipText(item.dataset.name, item.dataset.lore);
    if (item.dataset.material == 'PLAYER_HEAD') {
        right_sidebar.querySelector('#player_head_input-div').style.display = 'block';
    } else {
        right_sidebar.querySelector('#player_head_input-div').style.display = 'none';
    }
    switch (item.dataset.renderType) {
        case 'unset':
            right_sidebar.querySelector('#render_type').selectedIndex = 0;
            break;
        case 'global':
            right_sidebar.querySelector('#render_type').selectedIndex = 1;
            break;
        case 'child':
            right_sidebar.querySelector('#render_type').selectedIndex = 2;
            break;
    }
    switch (item.dataset.itemType) {
        case 'normal':
            right_sidebar.querySelector('#item_type').selectedIndex = 0;
            break;
        case 'paginated':
            right_sidebar.querySelector('#item_type').selectedIndex = 1;
            break;
    }
}

function closeSlotCustomizer() {
    var right_sidebar = document.querySelector('.right-sidebar');
    right_sidebar.style.display = "none";
    right_sidebar.querySelector('#amount_input').value = '';
    document.getElementById('tooltip-div').style.display = 'none';
    pinLore = false;
    document.getElementById('pin_lore').querySelector('embed').src = 'images/pin_icon.svg'
}

function moveSvgGroupTo(group, targetX, targetY) {
    // Calculate the current bounding box of the group
    const bbox = group.getBBox();
    const currentX = bbox.x;
    const currentY = bbox.y;

    // Calculate the difference between the target and current positions
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    // Move each element within the group by the calculated difference
    group.querySelectorAll('*').forEach(element => {
        // Move x coordinate if it exists
        if (element.hasAttribute('x')) {
            var elementX = parseFloat(element.getAttribute('x'));
            element.setAttribute('x', elementX + dx);
        }

        // Move y coordinate if it exists
        if (element.hasAttribute('y')) {
            var elementY = parseFloat(element.getAttribute('y'));
            element.setAttribute('y', elementY + dy);
        }
    });
}

function setMenuTitle(value) {
    var inventory = document.getElementById('inventory-texture');
    var embed = inventory.querySelector('embed');

    var svgDoc = embed.getSVGDocument();
    var svg = svgDoc.querySelector('svg');
    menu_name = value;

    var textElement = svg.getElementById('menu_name');
    if (value != '') {
        textElement.textContent = value;
    } else {
        textElement.textContent = 'Menu';
    }
}

function updateMenuSlots(value = null) {
    var input = document.getElementById('slots_input');
    if (value != null) {
        input.value = value;
    } else {
        value = input.value;
    }

    var errorText = document.querySelector('#slots_error span');
    if (value < 9) {
        errorText.innerHTML = "Please provide a number larger than 8"
        return;
    } else if (value > 54) {
        errorText.innerHTML = "Please provide a number smaller than 55"
        return;
    } else if (value % 9 != 0) {
        errorText.innerHTML = "Please provide a multiple of 9"
        return;
    }
    setInventorySlots(value)
}

function updateMenuTitle(value) {
    document.getElementById('title_input').value = value;
    setMenuTitle(value);
}

function updateItemAmount() {
    var input = document.getElementById('amount_input');
    var value = input.value;

    var errorText = document.querySelector('#item_amount_error span');
    if (value < 1 && value != '') {
        errorText.innerHTML = "Please provide a number larger than 0"
        return;
    } else if (value > 64 && value != '') {
        errorText.innerHTML = "Please provide a number smaller than 65"
        return;
    }
    setItemAmount(document.querySelector('.active-slot').querySelector('.item-slot-amount'), value);
}

function setItemAmount(element, amount) {
    if (amount == 1 || amount == '') {
        element.innerHTML = '';
    } else {
        element.innerHTML = amount;
    }
    element.parentElement.dataset.amount = amount;
}

function setItemLore(element, lore) {
    if (lore != '') {
        element.dataset.lore = JSON.stringify(lore.split('\n'));
    } else {
        element.dataset.lore = JSON.stringify([]);
    }
    if (element.dataset.itemType == 'paginated') {
        let lorePages = JSON.parse(element.dataset.lorePages);
        lorePages[currentLorePage] = JSON.parse(element.dataset.lore);
        element.dataset.lorePages = JSON.stringify(lorePages);
    }
    setTooltipText(element.dataset.name, element.dataset.lore);
}

function setTooltipText(name, lore) {
    let tooltip = document.getElementById('tooltip-div');
    if (name == '') {
        name = 'Name';
    }

    let item_name = tooltip.querySelector('#item_name');
    item_name.innerHTML = convertMinecraftColorToSpan(name);

    let oldItem_lore = tooltip.querySelector('#item_lore');
    let newItem_lore = document.createElement('div');
    newItem_lore.id = 'item_lore';

    let array = JSON.parse(lore);
    array.forEach(row => {
        if (/[a-zA-Z]/.test(row) || /\d/.test(row)) {
            let p = document.createElement('p');
            p.classList.add('lore_row');
            p.innerHTML = convertMinecraftColorToSpan(row);
            newItem_lore.appendChild(p);
        } else if (array.length != 1) {
            let br = document.createElement('br');
            newItem_lore.appendChild(br);
        }
    });
    oldItem_lore.replaceWith(newItem_lore);
}

function setItemName(element, name) {
    element.dataset.name = name;
    setTooltipText(element.dataset.name, element.dataset.lore);
}

function itemSearch(value) {
    const item_browser = document.getElementById('item_browser');
    let items = item_browser.querySelectorAll('.item');

    items.forEach(item => {
        if (item.id.replace('_', ' ').includes(value.toLowerCase())) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    })
}

let currentLorePage = 0;
function loadLorePages(item, pages = 0) {
    var right_sidebar = document.querySelector('.right-sidebar');
    const lore_input_button_div = document.getElementById('lore_input-buttons')
    const lore_page_text = lore_input_button_div.querySelector('#lore_page_indexes');
    currentLorePage = pages;
    if (item.dataset.itemType == 'normal') {
        if (item.dataset.lorePages) {
            item.dataset.lore = JSON.stringify(JSON.parse(item.dataset.lorePages)[0]);
            delete item.dataset.lorePages;
        }
        lore_input_button_div.style.display = 'none';
    } else if (item.dataset.itemType == 'paginated') {
        if (!item.dataset.lorePages) {
            let lore = JSON.parse(item.dataset.lore);
            item.dataset.lorePages = JSON.stringify([lore]);
        } else {
            item.dataset.lore = JSON.stringify(JSON.parse(item.dataset.lorePages)[pages]);
        }
        lore_input_button_div.style.display = 'flex';
        lore_page_text.innerHTML = `Page ${currentLorePage + 1} of ${JSON.parse(item.dataset.lorePages).length}`;
        setTooltipText(item.dataset.name, item.dataset.lore);
    }
    right_sidebar.querySelector('#lore_input').value = JSON.parse(item.dataset.lore).join('\n');
}

function nextLorePage(item) {
    let lorePages = JSON.parse(item.dataset.lorePages);
    if (currentLorePage < lorePages.length - 1) {
        currentLorePage++;
    } else {
        currentLorePage = 0;
    }
    loadLorePages(item, currentLorePage);
}

function prevLorePage(item) {
    let lorePages = JSON.parse(item.dataset.lorePages);
    if (currentLorePage > 0) {
        currentLorePage--;
    } else {
        currentLorePage = lorePages.length - 1;
    }
    loadLorePages(item, currentLorePage);
}

function addLorePage(item) {
    let lorePages = JSON.parse(item.dataset.lorePages);
    lorePages.push([]);
    item.dataset.lorePages = JSON.stringify(lorePages);
    loadLorePages(item, currentLorePage);
}

function removeLorePage(item) {
    let lorePages = JSON.parse(item.dataset.lorePages);
    if (lorePages.length > 1) {
        lorePages.pop();
        item.dataset.lorePages = JSON.stringify(lorePages);
        if (currentLorePage > lorePages.length - 1) {
            currentLorePage = lorePages.length - 1;
        }
        loadLorePages(item, currentLorePage);
    }
}

let copyTime;
let pinLore = false;
function setupListener() {
    var slots_input = document.getElementById('slots_input');
    var item_amount_input = document.getElementById('amount_input');
    var lore_input = document.getElementById('lore_input');
    var name_input = document.getElementById('name_input');
    var item_search_input = document.getElementById('item_container-search');
    var hide_attributes_input = document.getElementById('hide_attributes');
    var glint_input = document.getElementById('glint_input');
    var hide_tooltip = document.getElementById('hide_tooltip');
    var title_input = document.getElementById('title_input');
    var player_head_input = document.getElementById('player_head_input');
    var reset_button = document.getElementById('reset_button');
    var item_type = document.getElementById('item_type');
    const lore_input_button_div = document.getElementById('lore_input-buttons')
    const add_page = lore_input_button_div.querySelector('#add_page');
    const remove_page = lore_input_button_div.querySelector('#remove_page');
    var pin_lore = document.getElementById('pin_lore');
    const leftSidebar = document.querySelector('.left-sidebar');

    pin_lore.addEventListener('click', () => {
        let tooltip = document.getElementById('tooltip-div');
        pinLore = !pinLore;
        if (pinLore) {
            pin_lore.querySelector('embed').src = 'images/remove_pin_icon.svg'
            tooltip.style.display = 'block';
            tooltip.style.left = leftSidebar.querySelector('.container').getBoundingClientRect().right + 15 + 'px';
            tooltip.style.top = '30px';
            const activeItem = document.querySelector('.active-slot').querySelector('.item');
            setTooltipText(activeItem.dataset.name, activeItem.dataset.lore);
        } else if (!pinLore) {
            pin_lore.querySelector('embed').src = 'images/pin_icon.svg'
            tooltip.style.display = 'none';
        }
    })

    add_page.addEventListener('click', () => addLorePage(document.querySelector('.active-slot').querySelector('.item')));
    remove_page.addEventListener('click', () => removeLorePage(document.querySelector('.active-slot').querySelector('.item')));

    lore_input_button_div.querySelector('#left').addEventListener('click', (e) => {
        prevLorePage(document.querySelector('.active-slot').querySelector('.item'));
    })
    lore_input_button_div.querySelector('#right').addEventListener('click', (e) => {
        nextLorePage(document.querySelector('.active-slot').querySelector('.item'));
    })

    item_type.addEventListener('input', (e) => {
        const item = document.querySelector('.active-slot').querySelector('.item');
        item.dataset.itemType = e.target.value.toLowerCase();
        loadLorePages(item);
    });
    reset_button.addEventListener('click', () => {
        resetInventory();
    })
    var inputWithIDHolders = document.querySelectorAll('.input_with_id_holder');

    inputWithIDHolders.forEach(element => {
        element.querySelector('input').addEventListener('input', (e) => {
            const id_showcase = element.querySelector('#id_showcase');
            id_showcase.querySelector('span').innerHTML = createIdFromString(e.target.value);
        });
        const copy_icon = element.querySelector('i');
        element.querySelector('#id_showcase').addEventListener('click', (e) => {
            copy_icon.querySelector('span').innerHTML = 'Copied';
            copy_icon.querySelector('embed').src = 'images/check_icon.svg';
            const id = createIdFromString(element.querySelector('input').value);
            navigator.clipboard.writeText(`"${id}"`);
            if (copyTime) {
                clearTimeout(copyTime);
            }
            copyTime = setTimeout(() => {
                copy_icon.querySelector('span').innerHTML = 'Copy';
                copy_icon.querySelector('embed').src = 'images/copy_icon.svg';
            }, 2000);
        });
        element.querySelector('#id_showcase').addEventListener('mouseleave', (e) => {
            clearTimeout(copyTime);
            copy_icon.querySelector('span').innerHTML = 'Copy';
            copy_icon.querySelector('embed').src = 'images/copy_icon.svg';
        });
    });

    player_head_input.addEventListener('input', (e) => {
        const item = document.querySelector('.active-slot').querySelector('.item');
        item.dataset.headTexture = e.target.value;
        if (e.target.value == '') {
            item.dataset.headTexture = null;
        }
    });
    title_input.addEventListener('input', (e) => {
        updateMenuTitle(e.target.value);
    });
    slots_input.addEventListener('input', () => {
        updateMenuSlots();
    });
    item_amount_input.addEventListener('input', updateItemAmount);
    lore_input.addEventListener('input', (e) => {
        setItemLore(document.querySelector('.active-slot').querySelector('.item'), e.target.value);
    });
    name_input.addEventListener('input', (e) => {
        setItemName(document.querySelector('.active-slot').querySelector('.item'), e.target.value);
    });
    item_search_input.addEventListener('input', (e) => {
        itemSearch(e.target.value);
    });
    hide_attributes_input.addEventListener('input', (e) => {
        document.querySelector('.active-slot').querySelector('.item').dataset.hide_attributes = e.target.checked;
    })
    glint_input.addEventListener('input', (e) => {
        document.querySelector('.active-slot').querySelector('.item').dataset.glint = e.target.checked;
    })
    hide_tooltip.addEventListener('input', (e) => {
        document.querySelector('.active-slot').querySelector('.item').dataset.hide_tooltip = e.target.checked;
    });

    var menu_filling_input = document.getElementById('menu_filling_input');
    menu_filling_input.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    menu_filling_input.addEventListener('drop', (e) => {
        e.preventDefault();

        const draggedElementId = e.dataTransfer.getData('text');
        updateMenuFilling(draggedElementId);
    });
    menu_filling_input.addEventListener('click', (e) => {
        e.target.childNodes.forEach(element => {
            updateMenuFilling(null);
        })
    });
    document.getElementById('export_button').addEventListener('click', () => {
        createJsonFile();
    });
    document.getElementById('open_file_input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        openMenuFile(file);
    });
    document.getElementById('render_type').addEventListener('input', (e) => {
        document.querySelector('.active-slot').querySelector('.item').dataset.renderType = e.target.value.toLowerCase();
    });
}

let menuFilling = null;
function setMenuFilling(material) {
    if (material == null) {
        return;
    }
    let item_browser = document.getElementById('item_container');

    let slots_container = document.getElementById('item_slots_container');

    let fill = document.createElement('div');
    fill.classList = 'fill';
    fill.style.opacity = 1;
    fill.dataset.material = material;
    let img = item_browser.querySelector(`#${material.toLowerCase()}`).querySelector('img').cloneNode(true);
    fill.appendChild(img);

    slots_container.querySelectorAll('.item_slot').forEach(slot => {
        if (!slot.querySelector('.item')) {
            if (slot.querySelector('.fill')) {
                slot.querySelector('.fill').remove();
            }
            slot.setAttribute('draggable', false);

            slot.appendChild(fill.cloneNode(true));
        }
    });

    menuFilling = fill;
}

function updateMenuFilling(material) {
    if (material == null) {
        if (menu_filling_input.querySelector('.item')) {
            menu_filling_input.querySelector('.item').remove();
        }
        let slots_container = document.getElementById('item_slots_container');
        menuFilling = null;

        slots_container.querySelectorAll('.fill').forEach(slot => {
            slot.remove();
        });
        return;
    }
    const materialElement = document.getElementById(material).cloneNode(true);
    materialElement.style.opacity = 1;
    materialElement.dataset.material = material;
    setMenuFilling(materialElement.dataset.material);
    menu_filling_input.appendChild(materialElement);
}

const colors = new Map();

colors.set("a", "hsl(120, 100%, 67%)");
colors.set("b", "hsl(180, 100%, 67%)");
colors.set("c", "hsl(0, 100%, 67%)");
colors.set("d", "hsl(300, 100%, 67%)");
colors.set("e", "hsl(60, 100%, 67%)");
colors.set("f", "hsl(0, 0%, 100%)");
colors.set("0", "hsl(0, 0%, 0%)");
colors.set("1", "hsl(240, 100%, 33%)");
colors.set("2", "hsl(120, 100%, 33%)");
colors.set("3", "hsl(180, 100%, 33%)");
colors.set("4", "hsl(0, 100%, 33%)");
colors.set("5", "hsl(300, 100%, 33%)");
colors.set("6", "hsl(40, 100%, 50%)");
colors.set("7", "hsl(0, 0%, 67%)");
colors.set("8", "hsl(0, 0%, 33%)");
colors.set("9", "hsl(240, 100%, 67%)");

function convertMinecraftColorToSpan(text) {
    if (!text) return text;

    let result = "";
    let color = "hsl(0, 0%, 100%)";

    let bold = false;
    let italic = false;
    let underline = false;
    let strikethrough = false;
    let obfuscated = false;

    let currentSpan = "";

    for (let i = 0; i < text.length; i++) {
        // Optional & support
        if (text[i] == "§" || text[i] == "&") {
            if (i + 1 < text.length) {
                let c = text[i + 1];

                const hslValues = color.substring(4, color.length - 1).replace(/%/g, '');
                const hslArray = hslValues.split(',').map(value => parseFloat(value.trim()));

                let shadowColor = `hsl(${hslArray[0]}, ${hslArray[1]}%, ${hslArray[2] * 0.25}%)`;

                if (currentSpan) {
                    result += `<span style="color: ${color}; text-shadow: 2.5px 2.5px ${shadowColor}; `
                    if (bold) result += "font-family: Minecraft Bold;"
                    if (italic) result += "font-family: Minecraft Italic;"
                    if (underline) result += "text-decoration: underline;"
                    if (strikethrough) result += "text-decoration: line-through;"
                    if (obfuscated) result += "text-shadow: 0 0 0.5em white;"
                    result += `">${currentSpan}</span>`;

                    currentSpan = "";
                }

                if (c == "r") {
                    color = "hsl(0, 0%, 100%)";
                    bold = false;
                    italic = false;
                    underline = false;
                    strikethrough = false;
                    obfuscated = false;
                } else if (c == "l") {
                    bold = true;
                } else if (c == "o") {
                    italic = true;
                } else if (c == "n") {
                    underline = true;
                } else if (c == "m") {
                    strikethrough = true;
                } else if (c == "k") {
                    obfuscated = true;
                } else if (colors.has(c)) {
                    const newColor = colors.get(c);
                    color = newColor;
                }
                i++;
            }
        } else {
            currentSpan += text[i];
        }
    }

    if (currentSpan) {

        const hslValues = color.substring(4, color.length - 1).replace(/%/g, '');
        const hslArray = hslValues.split(',').map(value => parseFloat(value.trim()));

        let shadowColor = `hsl(${hslArray[0]}, ${hslArray[1]}%, ${hslArray[2] * 0.25}%)`;

        result += `<span style="color: ${color}; text-shadow: 2.5px 2.5px ${shadowColor}; `
        if (bold && italic) result += "font-family: Minecraft Bold Italic;"
        if (bold && !italic) result += "font-family: Minecraft Bold;"
        if (italic && !bold) result += "font-family: Minecraft Italic;"
        if (underline && !strikethrough) result += "text-decoration: underline;"
        if (strikethrough && !underline) result += "text-decoration: line-through;"
        if (strikethrough && underline) result += "text-decoration: line-through underline;"
        if (obfuscated) result += "text-shadow: 0 0 0.5em white;"
        result += `">${currentSpan}</span>`;
    }

    return result;
}

function createIdFromString(input) {
    return input
        .replace(/§./g, '')
        .replace(/[\[\(\{][^\[\]\(\)\{\}]*[\]\)\}]\s*/g, '')  // Remove everything inside brackets and trailing space
        .toLowerCase()                                       // Convert to lowercase
        .replace(/[^\w\s]/g, '')                             // Remove remaining special characters
        .replace(/\s+/g, '_')                                // Replace spaces with underscores
        .replace(/_+$/, '');                                 // Remove trailing underscore(s)
}

function createJsonFile() {
    let fillMaterial;
    if (menuFilling) {
        const imgAlt = menuFilling.querySelector('img').alt;
        fillMaterial = imgAlt.substring(0, imgAlt.lastIndexOf('.')).toUpperCase();
    }
    const menuData = {
        menuName: menu_name,
        slots: parseInt(menu_slots_amount),
        filling: menuFilling === null ? null : fillMaterial,
        items: []
    };
    const itemSlotsContainer = document.getElementById('item_slots_container');
    let items = itemSlotsContainer.querySelectorAll('.item');
    const existingIds = new Set();
    items.forEach(item => {
        id = createIdFromString(item.dataset.name);

        let uniqueId = id;
        let counter = 1;
        while (existingIds.has(uniqueId)) {
            uniqueId = `${id}${counter}`;  // Append counter to make id unique
            counter++;
        }

        // Once a unique id is found, add it to the set of used ids
        existingIds.add(uniqueId);

        const itemData = {
            material: item.dataset.material,
            amount: parseInt(item.dataset.amount),
            name: item.dataset.name,
            lore: JSON.parse(item.dataset.lore),
            glint: JSON.parse(item.dataset.glint),
            hideAttributes: JSON.parse(item.dataset.hide_attributes),
            hideTooltip: JSON.parse(item.dataset.hide_tooltip),
            slot: parseInt(item.parentElement.dataset.slot),
            renderType: item.dataset.renderType,
            itemType: item.dataset.itemType,
            id: uniqueId
        }
        if (item.dataset.material == "PLAYER_HEAD") {
            itemData.headTexture = item.dataset.headTexture === "null" ? null : item.dataset.headTexture;
        }
        if (item.dataset.itemType == "paginated") {
            itemData.lorePages = JSON.parse(item.dataset.lorePages);
        }
        menuData.items.push(itemData);
    });

    const jsonString = JSON.stringify(menuData, null, 2); // The second argument is for pretty-printing
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${menu_name.toLowerCase()}.json`; // The file name for the downloaded file

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
}

function resetInventory() {
    updateMenuTitle('');
    setMenuTitle('Menu');
    updateMenuSlots('');
    setInventorySlots(9);
    closeSlotCustomizer();
    const item_slots_container = document.getElementById('item_slots_container');
    item_slots_container.querySelectorAll('.item_slot').forEach(element => {
        element.childNodes.forEach(node => {
            node.remove();
        });
    });

    document.querySelector('.left-sidebar').querySelector('#id_showcase').querySelector('#item_id').innerHTML = '';
    updateMenuFilling(null);
}

function openMenuFile(file) {
    resetInventory();
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const menuData = JSON.parse(e.target.result);
                document.querySelector('.left-sidebar').querySelector('#id_showcase').querySelector('#item_id').innerHTML = createIdFromString(menuData.menuName);

                updateMenuTitle(menuData.menuName);
                updateMenuSlots(menuData.slots);

                const itemBrowser = document.getElementById('item_container');
                const itemSlotsContainer = document.getElementById('item_slots_container')
                const itemSlots = Array.from(itemSlotsContainer.querySelectorAll('.item_slot'));
                const menuItems = menuData.items;
                menuItems.forEach(item => {
                    let itemDiv = itemBrowser.querySelector(`#${item.material.toLowerCase()}`).cloneNode(true);
                    addItemProperties(itemDiv, item.material, item.lore, item.name, item.amount, item.hideAttributes, item.glint, item.hideTooltip, item.headTexture, item.renderType == undefined ? 'unset' : item.renderType, item.itemType == undefined ? 'normal' : item.itemType, JSON.stringify(item.lorePages));
                    const itemSlot = itemSlots.find(el => el.dataset.slot == item.slot);
                    setItemAmount(itemDiv.querySelector('.item-slot-amount'), item.amount);
                    itemSlot.appendChild(itemDiv);
                });

                updateMenuFilling(menuData.filling == null ? null : menuData.filling.toLowerCase());
            }
            catch (e) {
                showPopUpError('Error parsing JSON:' + e);
            }

            reader.onerror = () => {
                showPopUpError('Could not read file');
            }
        }

        reader.readAsText(file);
    }
}