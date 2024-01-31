/**
 * This file is part of the fne2 tg manager project.
 *
 * (c) 2024 Caleb <ko4uyj@gmail.com>
 *
 * For the full copyright and license information, see the
 * LICENSE file that was distributed with this source code.
 */

function addNewTalkGroup() {
    const newTgName = document.getElementById('newTgName').value;
    const newTgActive = document.getElementById('newTgActive').value === 'true';
    const newTgAffiliated = document.getElementById('newTgAffiliated').value === 'true';
    const newTgRoutable = document.getElementById('newTgRoutable').value === 'true';

    const selectedGroupIndex = parseInt(document.getElementById('newTgNetworkName').value, 10);
    const selectedGroup = groups[selectedGroupIndex];

    const newTalkGroup = {
        name: newTgName,
        config: {
            active: newTgActive,
            affiliated: newTgAffiliated,
            routable: newTgRoutable,
            ignored: []
        },
        source: {
            tgid: parseInt(document.getElementById('newTgSourceTgid').value, 10),
            slot: parseInt(document.getElementById('newTgSourceSlot').value, 10)
        },
        destination: [{
            network: document.getElementById('newTgDestNetwork').value,
            tgid: parseInt(document.getElementById('newTgDestTgid').value, 10),
            slot: parseInt(document.getElementById('newTgDestSlot').value, 10)
        }]
    };

    selectedGroup.groupVoice.push(newTalkGroup);

    addTalkGroupToUI(newTalkGroup, selectedGroupIndex, selectedGroup.groupVoice.length - 1);

    $('#addTalkGroupModal').modal('hide');
}

function addTalkGroupToUI(newTalkGroup, groupIndex, voiceIndex) {
    const voiceGroupsContainer = document.querySelector(`.group[data-group-index="${groupIndex}"] .voice-groups`);

    if (!voiceGroupsContainer) {
        console.error('Voice groups container not found');
        return;
    }

    const talkGroupDiv = document.createElement('div');
    talkGroupDiv.className = 'voice-group p-3 rounded';
    talkGroupDiv.setAttribute('data-voice-index', voiceIndex);
    talkGroupDiv.setAttribute('data-group-index', groupIndex);

    talkGroupDiv.innerHTML = `
        <h5 class="voice-group-header">Talk Group Name: ${newTalkGroup.name}</h5>
        <div class="form-group">
            <label>Name:</label>
            <input type="text" class="form-control voice-group-name" value="${newTalkGroup.name}" />
        </div>

        <div class="form-group">
            <label>Active:</label>
            <select class="form-control voice-group-active">
                <option value="true" ${newTalkGroup.config.active ? 'selected' : ''}>True</option>
                <option value="false" ${!newTalkGroup.config.active ? 'selected' : ''}>False</option>
            </select>
        </div>
    
        <div class="form-group">
            <label>Affiliated:</label>
            <select class="form-control voice-group-affiliated">
                <option value="true" ${newTalkGroup.config.affiliated ? 'selected' : ''}>True</option>
                <option value="false" ${!newTalkGroup.config.affiliated ? 'selected' : ''}>False</option>
            </select>
        </div>
    
        <div class="form-group">
            <label>Routable:</label>
            <select class="form-control voice-group-routable">
                <option value="true" ${newTalkGroup.config.routable ? 'selected' : ''}>True</option>
                <option value="false" ${!newTalkGroup.config.routable ? 'selected' : ''}>False</option>
            </select>
        </div>
    
        <div class="form-group">
            <label>Source TGID:</label>
            <input type="number" class="form-control voice-group-source-tgid" value="${newTalkGroup.source.tgid}" />
        </div>
    
        <div class="form-group">
            <label>Source Slot:</label>
            <input type="number" class="form-control voice-group-source-slot" value="${newTalkGroup.source.slot}" />
        </div>
    
        <div class="destination-group">
            <div class="form-group">
                <label>Destination Network:</label>
                <input type="text" class="form-control voice-group-destination-network" value="${newTalkGroup.destination[0].network}" />
            </div>
            <div class="form-group">
                <label>Destination TGID:</label>
                <input type="number" class="form-control voice-group-destination-tgid" value="${newTalkGroup.destination[0].tgid}" />
            </div>
            <div class="form-group">
                <label>Destination Slot:</label>
                <input type="number" class="form-control voice-group-destination-slot" value="${newTalkGroup.destination[0].slot}" />
            </div>
        </div>
    `;

    voiceGroupsContainer.appendChild(talkGroupDiv);
}


function saveChanges() {
    groups.length = 0;

    document.querySelectorAll('.group').forEach((groupElem, groupIndex) => {
        const groupNameInput = groupElem.querySelector('.group-name');
        if (!groupNameInput) {
            console.error(`Group name input not found at index: ${groupIndex}`);
            return;
        }
        const index = groupNameInput.getAttribute('data-group-index');
        const group = {
            name: groupNameInput ? groupNameInput.value : '',
            groupHangTime: parseInt(groupElem.querySelector('.group-hang-time')?.value, 10),
            master: groupElem.querySelector('.group-master')?.value === 'true',
            sendTgid: groupElem.querySelector('.group-send-tgid')?.value === 'true',
            groupVoice: []
        };

        groupElem.querySelectorAll('.voice-group').forEach((voiceElem, voiceIndex) => {
            const voiceGroupNameInput = voiceElem.querySelector('.voice-group-name');
            if (!voiceGroupNameInput) {
                console.error(`Voice group name input not found for voice group at index: ${voiceIndex} in group: ${groupIndex}`);
                return;
            }
            const voiceGroup = {
                name: voiceGroupNameInput ? voiceGroupNameInput.value : '',
                config: {
                    active: voiceElem.querySelector('.voice-group-active')?.value === 'true',
                    affiliated: voiceElem.querySelector('.voice-group-affiliated')?.value === 'true',
                    routable: voiceElem.querySelector('.voice-group-routable')?.value === 'true',
                    ignored: Array.from(voiceElem.querySelectorAll('.voice-group-ignored')).map(input => parseInt(input.value, 10))
                },
                destination: [],
                source: {
                    tgid: parseInt(voiceElem.querySelector('.voice-group-source-tgid')?.value, 10),
                    slot: parseInt(voiceElem.querySelector('.voice-group-source-slot')?.value, 10)
                }
            };

            voiceElem.querySelectorAll('.destination-group').forEach(destGroupElem => {
                const destination = {
                    network: destGroupElem.querySelector('.voice-group-destination-network')?.value,
                    tgid: parseInt(destGroupElem.querySelector('.voice-group-destination-tgid')?.value, 10),
                    slot: parseInt(destGroupElem.querySelector('.voice-group-destination-slot')?.value, 10)
                };
                voiceGroup.destination.push(destination);
            });

            group.groupVoice.push(voiceGroup);
        });

        groups.push(group);
    });

    $.ajax({
        url: '/writeTgRuleChanges',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(groups),
        success: function(response) {
            alert('Changes saved successfully!');
        },
        error: function(xhr, status, error) {
            alert('Error saving changes: ' + error);
        }
    });
}