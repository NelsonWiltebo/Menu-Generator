let menu_name;
let menu_slots_amount;

document.addEventListener('DOMContentLoaded', () => {
    var inventory = document.getElementById('inventory-texture');
    inventory.querySelector('embed').addEventListener('load', () => {
        setupListener()
        setInventorySlots(9)

        var inventory = document.getElementById('inventory');
        var embed = inventory.querySelector('embed');

        var svgDoc = embed.getSVGDocument();

        var svg = svgDoc.querySelector('svg');
        var item_row = svg.querySelector('.item_row');

        addItemSlots(item_row.querySelectorAll('foreignObject'));
        setMenuName("Menu");
    });
    loadItemImages();
});

function loadItemImages() {
    fetch('../images/items_1.21/_item_list.json')
        .then(response => response.json())
        .then(files => {
            const item_browser = document.getElementById('item_container');

            files.forEach(file => {
                const div = document.createElement('div');
                div.classList.add("item");
                const img = document.createElement('img');

                img.src = `../images/items_1.21/${file}`
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

    let svgWidth = parseFloat(svg.getAttribute('width'));
    let newHeight = svg.getBBox().height;
    svg.setAttribute('height', newHeight);

    // Update the viewBox to accommodate the new height
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${newHeight}`);
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
            if (item && item.dataset.hide_tooltip == 'false') {
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
            if (item && item.dataset.hide_tooltip == 'false') {
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
            item.dataset.material = material.substring(0, material.lastIndexOf('.')).toUpperCase();

            if (!item.dataset.lore) {
                item.dataset.lore = '[""]';
            }
            if (!item.dataset.name) {
                setItemName(item, 'Icon');
            }
            if (!item.dataset.amount) {
                item.dataset.amount = 1;
            }
            if (!item.dataset.hide_attributes) {
                item.dataset.hide_attributes = 'false';
            }
            if (!item.dataset.glint) {
                item.dataset.glint = 'false';
            }
            if (!item.dataset.hide_tooltip) {
                item.dataset.hide_tooltip = 'false';
            }

            if (item.querySelector('.item-slot-amount') == null) {
                const amount = document.createElement('span');
                amount.classList.add('item-slot-amount');
                item.appendChild(amount);
            }

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
    console.log(target.querySelector('.item').dataset.material);
    openSlotCustomizer(target);
}

function openSlotCustomizer(target) {
    var right_sidebar = document.querySelector('.right-sidebar');
    right_sidebar.style.display = "grid";
    right_sidebar.querySelector('.slot_customizer-title').innerHTML = `Slot #${target.dataset.slot}`;
    right_sidebar.querySelector('#amount_input').value = target.querySelector('.item').dataset.amount;
    right_sidebar.querySelector('#lore_input').value = JSON.parse(target.querySelector('.item').dataset.lore).join('\n');
    right_sidebar.querySelector('#name_input').value = target.querySelector('.item').dataset.name;
    right_sidebar.querySelector('#hide_attributes').checked = target.querySelector('.item').dataset.hide_attributes === "true";
    right_sidebar.querySelector('#glint_input').checked = target.querySelector('.item').dataset.glint === "true";
    right_sidebar.querySelector('#hide_tooltip').checked = target.querySelector('.item').dataset.hide_tooltip === "true";
}

function closeSlotCustomizer() {
    var right_sidebar = document.querySelector('.right-sidebar');
    right_sidebar.style.display = "none";
    right_sidebar.querySelector('#amount_input').value = '';
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

function updateMenuTitle() {
    var input = document.querySelector('.left-sidebar #title_input')
    var value = input.value;

    setMenuName(value);
}

function setMenuName(value) {
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

function updateMenuSlots() {
    var input = document.getElementById('slots_input');
    var value = input.value;

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
    element.dataset.lore = JSON.stringify(lore.split('\n'));
    setTooltipText(element.dataset.name, element.dataset.lore);
}

function setTooltipText(name, lore) {
    let tooltip = document.getElementById('tooltip-div');

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
    if (name == '') {
        name = 'Icon';
    }
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

function setupListener() {
    var slots_input = document.getElementById('slots_input');
    var item_amount_input = document.getElementById('amount_input');
    var lore_input = document.getElementById('lore_input');
    var name_input = document.getElementById('name_input');
    var item_search_input = document.getElementById('item_container-search');
    var hide_attributes_input = document.getElementById('hide_attributes');
    var glint_input = document.getElementById('glint_input');
    var hide_tooltip = document.getElementById('hide_tooltip');

    slots_input.addEventListener('input', updateMenuSlots);
    item_amount_input.addEventListener('input', updateItemAmount);
    lore_input.addEventListener('input', () => {
        setItemLore(document.querySelector('.active-slot').querySelector('.item'), lore_input.value);
    });
    name_input.addEventListener('input', () => {
        setItemName(document.querySelector('.active-slot').querySelector('.item'), name_input.value);
    });
    item_search_input.addEventListener('input', () => {
        itemSearch(item_search_input.value);
    });
    hide_attributes_input.addEventListener('input', () => {
        document.querySelector('.active-slot').querySelector('.item').dataset.hide_attributes = hide_attributes_input.checked;
    })
    glint_input.addEventListener('input', () => {
        document.querySelector('.active-slot').querySelector('.item').dataset.glint = glint_input.checked;
    })
    hide_tooltip.addEventListener('input', () => {
        document.querySelector('.active-slot').querySelector('.item').dataset.hide_tooltip = hide_tooltip.checked;
    })

    var menu_filling_input = document.getElementById('menu_filling_input');
    menu_filling_input.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    menu_filling_input.addEventListener('drop', (e) => {
        e.preventDefault();

        const draggedElementId = e.dataTransfer.getData('text');
        const draggedElement = document.getElementById(draggedElementId).cloneNode(true);
        if (menu_filling_input.querySelector('.item')) {
            menu_filling_input.querySelector('.item').remove();
        }
        draggedElement.dataset.material = e.dataTransfer.getData('text').toUpperCase();
        setMenuFilling(draggedElement.dataset.material);
        menu_filling_input.appendChild(draggedElement);

        draggedElement.style.opacity = 1;
    });
    menu_filling_input.addEventListener('click', () => {
        menu_filling_input.childNodes.forEach(element => {
            element.remove();
            removeMenuFilling();
        })
    });
    document.getElementById('export_button').addEventListener('click', (e) => {
        createJsonFile();
    });
}

let menuFilling = null;
function setMenuFilling(material) {
    let item_browser = document.getElementById('item_container');

    let slots_container = document.getElementById('item_slots_container');

    let fill = document.createElement('div');
    fill.classList = 'fill';
    fill.style.opacity = 1;
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

function removeMenuFilling() {
    let slots_container = document.getElementById('item_slots_container');
    menuFilling = null;

    slots_container.querySelectorAll('.fill').forEach(slot => {
        slot.remove();
    });
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

function createJsonFile() {
    let fillMaterial;
    if (menuFilling) {
        const imgAlt = menuFilling.querySelector('img').alt;
        fillMaterial = imgAlt.substring(0, imgAlt.lastIndexOf('.')).toUpperCase();
    }
    const menuData = {
        "menu name": menu_name,
        slots: parseInt(menu_slots_amount),
        filling: menuFilling === null ? null : fillMaterial
    };

    // Step 2: Convert the JSON object to a JSON string
    const jsonString = JSON.stringify(menu_name, null, 2); // The second argument is for pretty-printing

    // Step 3: Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: "application/json" });

    // Step 4: Create a link to download the Blob
    const link = document.createElement("a");

    // Step 5: Set the download attribute and create a URL for the Blob
    link.href = URL.createObjectURL(blob);
    link.download = `${menu_name.toLowerCase()}.json`; // The file name for the downloaded file

    // Step 6: Append the link to the document body (necessary for Firefox) and click it
    document.body.appendChild(link);
    link.click();

    // Step 7: Remove the link from the document after the download
    document.body.removeChild(link);
}

function download(url) {
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

function openMenuFile() {

}