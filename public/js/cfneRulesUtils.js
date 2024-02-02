//TODO: Fix the adds to work right with latest changes
function addInclusion(groupIndex) {
    const inclusionContainer = document.querySelector(`.group[data-group-index="${groupIndex}"] .inclusion-group`);
    const newInclusionInput = document.createElement('input');
    newInclusionInput.type = 'text';
    newInclusionInput.className = 'form-control inclusion-id';
    newInclusionInput.setAttribute('data-group-index', groupIndex);
    inclusionContainer.appendChild(newInclusionInput);
}

function addExclusion(groupIndex) {
    const exclusionContainer = document.querySelector(`.group[data-group-index="${groupIndex}"] .exclusion-group`);
    const newExclusionInput = document.createElement('input');
    newExclusionInput.type = 'text';
    newExclusionInput.className = 'form-control exclusion-id';
    newExclusionInput.setAttribute('data-group-index', groupIndex);
    exclusionContainer.appendChild(newExclusionInput);
}

function addRewrite(groupIndex) {
    const rewriteContainer = document.querySelector(`.group[data-group-index="${groupIndex}"] .rewrite-group`);
    const rewriteDiv = document.createElement('div');
    rewriteDiv.className = 'rewrite-entry';
    rewriteDiv.innerHTML = `
        <input type="number" class="form-control peer-id" placeholder="Peer ID">
        <input type="number" class="form-control tgid" placeholder="TGID">
        <input type="number" class="form-control slot" placeholder="Slot">
    `;
    rewriteContainer.appendChild(rewriteDiv);
}

function addNewTalkGroup() {
    const newTgName = document.getElementById('newTgName').value;
    const newTgActive = document.getElementById('newTgActive').value === 'true';
    const newTgSourceTgid = parseInt(document.getElementById('newTgSourceTgid').value, 10);
    const newTgSourceSlot = parseInt(document.getElementById('newTgSourceSlot').value, 10);

    const newTalkGroup = {
        name: newTgName,
        config: {
            active: newTgActive,
            inclusion: [],
            exclusion: [],
            rewrite: []
        },
        source: {
            tgid: newTgSourceTgid,
            slot: newTgSourceSlot
        }
    };

    groups.groupVoice.push(newTalkGroup);
    addTalkGroupToUI(newTalkGroup, groups.groupVoice.length - 1);

    $('#addTalkGroupModal').modal('hide');
}

function addTalkGroupToUI(newTalkGroup, voiceIndex) {
    const groupsContainer = document.querySelector('#talkGroupsContainer');

    const groupDiv = document.createElement('div');
    groupDiv.className = 'group mb-3 p-3 border rounded bg-light';
    groupDiv.setAttribute('data-group-index', voiceIndex);
    groupDiv.innerHTML = `
        <h3><input type="text" class="form-control group-name" id="group-name-${voiceIndex}" value="${newTalkGroup.name}" /></h3>
        <div>
            <label for="group-active-${voiceIndex}">Active:</label>
            <select class="form-control group-active" id="group-active-${voiceIndex}">
                <option value="true" ${newTalkGroup.config.active ? 'selected' : ''}>True</option>
                <option value="false" ${!newTalkGroup.config.active ? 'selected' : ''}>False</option>
            </select>
        </div>
        <div>
            <label for="group-inclusion-${voiceIndex}">Inclusions:</label>
            <input type="text" class="form-control group-inclusion" id="group-inclusion-${voiceIndex}" value="" placeholder="Enter inclusions separated by commas" />
        </div>
        <div>
            <label for="group-exclusion-${voiceIndex}">Exclusions:</label>
            <input type="text" class="form-control group-exclusion" id="group-exclusion-${voiceIndex}" value="" placeholder="Enter exclusions separated by commas" />
        </div>
        <div class="rewrite-group" data-group-index="${voiceIndex}">
            <button type="button" class="btn btn-info" onclick="addRewrite(${voiceIndex})">Add Rewrite</button>
        </div>
        <div>
            <label for="group-source-tgid-${voiceIndex}">Source TGID:</label>
            <input type="number" class="form-control group-source-tgid" id="group-source-tgid-${voiceIndex}" value="${newTalkGroup.source.tgid}" />
        </div>
        <div>
            <label for="group-source-slot-${voiceIndex}">Source Slot:</label>
            <input type="number" class="form-control group-source-slot" id="group-source-slot-${voiceIndex}" value="${newTalkGroup.source.slot}" />
        </div>
    `;
    groupsContainer.appendChild(groupDiv);
}


function saveChanges() {
    const updatedGroups = groups.groupVoice.map((group, groupIndex) => {
        const groupElem = document.querySelector(`.group[data-group-index="${groupIndex}"]`);

        if (!groupElem) {
            console.error(`Group element not found at index: ${groupIndex}`);
            return null;
        }

        const groupNameInput = groupElem.querySelector(`#group-name-${groupIndex}`);
        const groupActiveSelect = groupElem.querySelector(`#group-active-${groupIndex}`);
        const groupSourceTgidInput = groupElem.querySelector(`#group-source-tgid-${groupIndex}`);
        const groupSourceSlotInput = groupElem.querySelector(`#group-source-slot-${groupIndex}`);
        const groupInclusionInput = groupElem.querySelector(`#group-inclusion-${groupIndex}`);
        const groupExclusionInput = groupElem.querySelector(`#group-exclusion-${groupIndex}`);

        if (!groupNameInput || !groupActiveSelect || !groupSourceTgidInput || !groupSourceSlotInput) {
            console.error(`One or more inputs not found for group at index: ${groupIndex}`);
            return null;
        }

        const inclusions = groupInclusionInput && groupInclusionInput.value ? groupInclusionInput.value.split(',').map(id => id.trim()) : [];
        const exclusions = groupExclusionInput && groupExclusionInput.value ? groupExclusionInput.value.split(',').map(id => id.trim()) : [];

        //TODO: Collect rewrite rules, ensure that rewrite elements are correctly structured and accessed

        return {
            name: groupNameInput.value,
            config: {
                active: groupActiveSelect.value === 'true',
                inclusion: inclusions,
                exclusion: exclusions,
                //TODO: Handle rewrites properly
                rewrite: []
            },
            source: {
                tgid: parseInt(groupSourceTgidInput.value, 10),
                slot: parseInt(groupSourceSlotInput.value, 10)
            }
        };
    }).filter(group => group !== null);

    $.ajax({
        url: '/writeTgRuleChanges',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ groupVoice: updatedGroups }),
        success: function(response) {
            alert('Changes saved successfully!');
        },
        error: function(xhr, status, error) {
            alert('Error saving changes: ' + error);
        }
    });
}