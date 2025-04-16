/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

/**
 * Simple badge-style component that just displays a value
 * And provides navigation to the referenced record when clicked
 */
class FancyMany2One extends Component {
    static template = "my_module.FancyMany2One";
    
    static props = {
        value: { type: Array, optional: true },
        readonly: { type: Boolean, optional: true },
        record: { type: Object, optional: true },
        name: { type: String, optional: true },
        relation: { type: String, optional: true },
    };
    
    setup() {
        // Get the action service to navigate to records
        this.actionService = useService("action");
    }
    
    get displayValue() {
        return this.props.value && this.props.value.length > 1 ? this.props.value[1] : "";
    }
    
    get recordId() {
        return this.props.value && this.props.value.length > 0 ? this.props.value[0] : false;
    }
    
    get isReadonly() {
        // Check record state for readonly status
        if (this.props.record && this.props.record.data) {
            return this.props.readonly || this.props.record.data.state === 'confirmed';
        }
        return this.props.readonly || false;
    }
    
    /**
     * Navigate to the referenced record when clicked
     */
    onClick() {
        if (this.recordId && this.props.relation) {
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: this.props.relation,
                res_id: this.recordId,
                views: [[false, "form"]],
                target: "current",
            });
        }
    }
}

// Register as a field widget
registry.category("fields").add("fancy_many2one", FancyMany2One);

export default FancyMany2One;