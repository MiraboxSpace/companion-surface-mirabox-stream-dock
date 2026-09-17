import type { StreamDockInputDefinition, StreamDockModelDefinition } from './list.js'
import { N4_1234Definition } from './N4-1234.js'

/**
 * The N4 Pro uses the same control layout as the N4, but its rotary encoders
 * report both press (parameter 0x01) and release (parameter 0x00). It also has
 * an RGB LED above each encoder. The four RGB triplets form a 12-byte SETLB payload.
 */
export const N4ProDefinition: StreamDockModelDefinition = {
	...N4_1234Definition,
	productName: 'Stream Dock N4 Pro',
	usbIds: [{ vendorId: 0x5548, productIds: [0x1008, 0x1021] }],
	ledArrayLength: 12,
	inputs: N4_1234Definition.inputs.map((input): StreamDockInputDefinition => {
		if ((input.row === 2 || input.row === 3) && input.type === 'push') {
			return { ...input, type: 'button' }
		}

		return { ...input }
	}),
	touchSoftKeys: {
		minX: 114,
		maxX: 693,
		inputIds: [0x40, 0x41, 0x42, 0x43],
	},
	outputs: [
		...N4_1234Definition.outputs,
		{ type: 'led', id: 0, row: 3, column: 0, name: 'Rotary encoder LED 1' },
		{ type: 'led', id: 1, row: 3, column: 1, name: 'Rotary encoder LED 2' },
		{ type: 'led', id: 2, row: 3, column: 2, name: 'Rotary encoder LED 3' },
		{ type: 'led', id: 3, row: 3, column: 3, name: 'Rotary encoder LED 4' },
	],
	configFields: [
		{
			id: 'vibrationEnabled',
			type: 'checkbox',
			label: 'Enable vibration',
			default: true,
		},
	],
}
