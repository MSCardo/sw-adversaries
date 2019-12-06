
import React from "react";
import { InputText, InputTextArea } from "./input-text";
import InputSelect from "./input-select";
import InputSelectMulti from "./input-select-multi";
import PanelListEdit from "./panel-list-edit";
import PanelTalentEdit from "./panel-talent-edit";
import PanelWeaponEdit from "./panel-weapon-edit";
import PanelCode from "./panel-code";

import dispatcher from "lib/dispatcher";
import * as CONFIG from "lib/config";
import { sortByProperty } from "lib/utils";

const RANGED = 1;
const MELEE = 0;


export default class CharacterEdit extends React.Component {
	constructor(props) {
		super(props);

		let baseCharacter = {
			"name": "",
			"type": "",
			"description": "",
			"characteristics": {},
			"derived": {},
			"skills": null,
			"talents": [],
			"abilities": [],
			"weapons": [],
			"gear": [],
			"tags": []
		};

		let editingCharacter = JSON.parse(JSON.stringify(Object.assign(baseCharacter, props.character)));

		editingCharacter.derived.defence = editingCharacter.derived.defence || [0, 0];

		this.state = {
			character: editingCharacter
		};

		this.characteristics = ["Brawn", "Agility", "Intellect", "Cunning", "Willpower", "Presence"];
	}

	save() {
		dispatcher.dispatch(CONFIG.ADVERSARY_SAVE, this.state.character);
	}

	cancel() {
		dispatcher.dispatch(CONFIG.ADVERSARY_CANCEL);
	}

	setDerivedValue(attr1, attr2) {
		return function(value) {
			let character = this.state.character;

			character[attr1][attr2] = value;

			this.setState({
				character: character
			});
		}
	}

	setValue(attr) {
		return function(value) {
			let character = this.state.character;

			character[attr] = value;

			this.setState({
				character: character
			});
		}
	}

	setDefence(type) {
		return function(value) {
			let character = this.state.character;

			character.derived.defence[type] = value;

			this.setState({
				character: character
			});
		}
	}

	// add an item to a list
	addHandler(attr) {
		return function(item) {
			let character = this.state.character;

			character[attr].push(item);

			this.setState({
				character: character
			});
		};
	}

	// remove an item from a list of properties
	removeHandler(attr) {
		return function(index) {
			let character = this.state.character;

			character[attr].splice(index, 1);

			this.setState({
				character: character
			});
		};
	}

	setTags(val) {
		let character = this.state.character;

		if(character.tags.indexOf(val) == -1) {
			character.tags.push(val);
		}
		else {
			character.tags.splice(character.tags.indexOf(val), 1);
		}

		this.setState({
			character: character
		});
	}

	isNemesis() {
		return this.state.character.type == "Nemesis";
	}

	canSave() {
		let derived = ["soak", "wounds"];

		if(this.isNemesis()) {
			derived.push("strain");
		}

		let required = this.characteristics.length + derived.length;

		return [
			...this.characteristics.map(c => this.state.character.characteristics[c]),
			...derived.map(d => this.state.character.derived[d])
		].filter(f => f != "").length == required;
	}

	render() {
		let character = this.state.character;

		if(!character) {
			return null;
		}


console.log(character)

/*

			-Name
			-Type
			-Characteristics
			-Soak
			-Wound Threshold
			-Strain Threshold
			-Defence
			-Melee
			-Ranged
			-Skills - this needs to be a list with check boxes for minions
			Weapons (selector or add own)
			- Talents (selector or add own)
			- Abilities (selector or add own)
			-Gear
			Tags (selector or add own - do these need to be separated out?)


			Weapon qualities - some are ranked and the UI will need to account for this
			What to do about deleting and general managing of characters?

Tags

remove tag and insert automatically
	type
	source (mine)
exclude
	file
	book
	starred

adventure should be entirely custom

species should be a single select list

location can be multiple select list





			*/

		
		let skills = this.props.skills;
		let types = ["Minion", "Rival", "Nemesis"];
		let [talents, abilities] = ["talents", "abilities"].map(key => {
			// remove rank from the end of the name
			let noRanks = character[key].map(t => t.name || t).map(t => t.replace(/\s\d+$/, ""));

			return this.props.talents.filter(t => t.type == key).filter(t => noRanks.indexOf(t.name) == -1).sort(sortByProperty("name"));
		});
		let weapons = this.props.weapons.all().sort(sortByProperty("name"));
		let tags = {
			other: []
		};

		// remove some tags to be handled separately
		let exclude = ["file:", "book:", "source:", "adventure:", "starred:", "nemesis", "minion", "rival"]

		this.props.tags.sort().filter(f => exclude.filter(ex => f.startsWith(ex)).length == 0).forEach(t => {
			if(t.indexOf(":") == -1) {
				tags.other.push(t);
			}
			else {
				let [key, value] = t.split(":");

				tags[key] = tags[key] || [];
				tags[key].push(value);
			}
		});

		let tagComponents = Object.keys(tags).map(t => <InputSelectMulti label={ t } value={ character.tags } values={ tags[t] } handler={ this.setTags.bind(this) } />);

		return <div id="edit">
			<h1>Character</h1>
			<InputText label="Name" value={ character.name } handler={ this.setValue("name").bind(this) } required={ true } />
			<InputSelect label="Type" value={ character.type } values={ types } handler={ this.setValue("type").bind(this) } />

			<div className="edit-panel">
				<h2>Characteristics</h2>
				{ this.characteristics.map(c => <InputText label={ c } value={ character.characteristics[c] } handler={ this.setDerivedValue("characteristics", c).bind(this) } required={ true } />) }
			</div>

			<div className="edit-panel">
				<h2>Derived Characteristics</h2>

				<InputText label="Soak" value={ character.derived.soak } handler={ this.setDerivedValue("derived", "soak").bind(this) } required={ true } />
				<InputText label="Wound Threshold" value={ character.derived.wounds } handler={ this.setDerivedValue("derived", "wounds").bind(this) } required={ true } />
				{ this.isNemesis() ? <InputText label="Strain Threshold" value={ character.derived.strain } handler={ this.setDerivedValue("derived", "strain").bind(this) } required={ true } /> : null }
				<InputText label="Melee Defence" value={ character.derived.defence[MELEE] } handler={ this.setDefence(MELEE).bind(this) } />
				<InputText label="Ranged Defence" value={ character.derived.defence[RANGED] } handler={ this.setDefence(RANGED).bind(this) } />
			</div>

			<div className="edit-panel">
				<h2>Skills</h2>
				{ skills.map(s => <InputText label={ s.name } value={ character.skills[s.name] } handler={ this.setDerivedValue("skills", s.name).bind(this) } />) }
			</div>

			<PanelListEdit title="Weapons" list={ character.weapons } remove={ this.removeHandler("weapons").bind(this) }>
				<PanelWeaponEdit list={ weapons } skills={ this.props.skills.filter(s => s.type == "Combat") } qualities={ this.props.qualities } handler={ this.addHandler("weapons").bind(this) } />
			</PanelListEdit>
			<PanelListEdit title="Talents" list={ character.talents } remove={ this.removeHandler("talents").bind(this) }>
				<PanelTalentEdit list={ talents } title="Talent" handler={ this.addHandler("talents").bind(this) } />
			</PanelListEdit>
			<PanelListEdit title="Abilities" list={ character.abilities } remove={ this.removeHandler("abilities").bind(this) }>
				<PanelTalentEdit list={ abilities } title="Ability" handler={ this.addHandler("abilities").bind(this) } />
			</PanelListEdit>

			<div className="edit-panel">
				<h2>Gear</h2>
				<InputTextArea label="Gear" value={ character.gear } handler={ this.setValue("gear").bind(this) } />
				<PanelCode />
			</div>

			<div className="edit-panel">
				<h2>Tags</h2>
				{ tagComponents }
			</div>

			<div className="row-buttons">
				<button className="btn-save" disabled={ !this.canSave() } onClick={ this.save.bind(this) }>Save</button>
				<button className="btn-cancel" onClick={ this.cancel.bind(this) }>Cancel</button>
			</div>
		</div>;
	}
}