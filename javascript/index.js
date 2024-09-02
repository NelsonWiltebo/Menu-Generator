
document.addEventListener('DOMContentLoaded', () => {
    var inventory = document.getElementById('inventory-texture');
    inventory.querySelector('embed').addEventListener('load', () => {
        setupListener()
        setInventoryRows(1)
        setMenuName("Menu")
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
                img.id = crypto.randomUUID();
                img.alt = file;
                img.setAttribute('draggable', true);

                img.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text', e.target.id);

                    img.style.opacity = 0.5;
                })

                img.addEventListener('dragend', () => {
                    img.style.opacity = 1;
                })

                div.appendChild(img);
                item_browser.appendChild(div);
            }
            )
        }
        )
}

function setInventoryRows(amount) {
    var inventory = document.getElementById('inventory');
    var embed = inventory.querySelector('embed');

    var svgDoc = embed.getSVGDocument();

    var svg = svgDoc.querySelector('svg');
    var item_row = svg.getElementById('item_row');

    var bottom_border = svg.getElementById('bottom_border')
    var top_border = svg.getElementById('top_border');

    var item_rows = svg.querySelectorAll('#item_row');
    var item_slots = inventory.querySelectorAll('.item_slot');

    for (let i = 1; i < item_rows.length; i++) {
        svg.removeChild(item_rows[i]);
    }

    for (let i = 1; i < amount; i++) {
        var newRow = item_row.cloneNode(true);

        moveSvgGroupTo(newRow, 0, item_row.getBBox().y + 2 + item_row.getBBox().height * (i - 1));

        svg.appendChild(newRow);
    }
    moveSvgGroupTo(bottom_border, svg.getBBox().x, svg.getBBox().y + top_border.getBBox().height + item_row.getBBox().height * svg.querySelectorAll('#item_row').length - 2);

    let svgWidth = parseFloat(svg.getAttribute('width'));
    let newHeight = svg.getBBox().height;
    svg.setAttribute('height', newHeight);

    // Update the viewBox to accommodate the new height
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${newHeight}`);

    addItemSlots();
    for (let i = 0; i < item_slots.length; i++) {
        document.getElementById('item_slots_container').removeChild(item_slots[i]);
    }
}

function addItemSlots() {
    var inventory = document.getElementById('inventory');
    var embed = inventory.querySelector('embed');

    var svgDoc = embed.getSVGDocument();

    var svg = svgDoc.querySelector('svg');

    var item_slots = svg.querySelectorAll('foreignObject');

    item_slots.forEach(slot => {
        const div = document.createElement('div');
        div.classList.add('item_slot');
        div.style.position = 'absolute';
        div.style.left = slot.getBoundingClientRect().x + 'px';
        div.style.top = slot.getBoundingClientRect().y + 'px';
        div.style.width = slot.getBoundingClientRect().width + 'px';
        div.style.height = slot.getBoundingClientRect().height + 'px';

        div.addEventListener('click', itemSlotClick);

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        div.addEventListener('drop', (e) => {
            e.preventDefault();

            const draggedElementId = e.dataTransfer.getData('text');
            const draggedElement = document.getElementById(draggedElementId).cloneNode(true);
            draggedElement.style.opacity = 1;

            div.appendChild(draggedElement);
        });

        document.getElementById('item_slots_container').appendChild(div);
    });
}

function itemSlotClick() {
    var right_sidebar = document.querySelector('.right-sidebar');
    right_sidebar.style.display = "grid";
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

function updateMenuName() {
    var input = document.querySelector('.left-sidebar #name_input')
    var value = input.value;

    setMenuName(value);
}

function setMenuName(value) {
    var inventory = document.getElementById('inventory-texture');
    var embed = inventory.querySelector('embed');

    var svgDoc = embed.getSVGDocument();
    var svg = svgDoc.querySelector('svg');

    var textElement = svg.getElementById('menu_name');
    textElement.textContent = value;
}

setMenuName("Menu");

function keyDown() {
    console.log('key down')
}

function keyUp() {
    console.log('key up')
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
    setInventoryRows(value / 9)
}

function setupListener() {
    var input = document.getElementById('slots_input');

    input.addEventListener('input', updateMenuSlots);
}