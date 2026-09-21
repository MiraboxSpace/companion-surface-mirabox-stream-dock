import {
	createModuleLogger,
	type DiscoveredSurfaceInfo,
	type HIDDevice,
	type OpenSurfaceResult,
	type SurfaceContext,
	type SurfacePlugin,
} from '@companion-surface/base'
import { generatePincodeMap as createPincodeMap } from './pincode.js'
import { MiraboxWrapper } from './instance.js'
import { createSurfaceSchema } from './surface-schema.js'
import { createConfigFields } from './config.js'
import { HIDAsync } from 'node-hid'
import { AllModels, StreamDockModelDefinition } from './models/list.js'

export interface MiraboxPluginInfo {
	device: HIDDevice
	model: StreamDockModelDefinition
}

const logger = createModuleLogger('Plugin')

const MiraboxPlugin: SurfacePlugin<MiraboxPluginInfo> = {
	init: async (): Promise<void> => {
		// Nothing to do
		console.log('initializing Mirabox Surface integration')
	},
	destroy: async (): Promise<void> => {
		// Nothing to do
	},

	checkSupportsHidDevice: (device: HIDDevice): DiscoveredSurfaceInfo<MiraboxPluginInfo> | null => {
		// Match the device against known models
		const model = AllModels.find((model) => {
			const usbIdMatches = model.usbIds.some(
				(usbId) => usbId.vendorId === device.vendorId && usbId.productIds.includes(device.productId),
			)
			if (!usbIdMatches || device.interface !== (model.hidInterface ?? 0)) return false
			// macOS exposes all collections on an interface through the same HID path.
			// Companion keeps the last collection for that path when opening a device,
			// so its usage can differ from the collection that passed discovery.
			// An explicit interface selector still excludes the keyboard interface.
			if (process.platform !== 'darwin' || model.hidInterface === undefined) {
				if (model.hidUsagePage !== undefined && device.usagePage !== model.hidUsagePage) return false
				if (model.hidUsage !== undefined && device.usage !== model.hidUsage) return false
			}
			return true
		})
		if (!model) return null

		logger.debug(`Checked HID device: ${model.productName}`)

		return {
			surfaceId: `streamdock:${device.serialNumber}`,
			description: `Mirabox ${model.productName}`,
			pluginInfo: {
				device,
				model,
			},
		}
	},

	openSurface: async (
		surfaceId: string,
		pluginInfo: MiraboxPluginInfo,
		context: SurfaceContext,
	): Promise<OpenSurfaceResult> => {
		const device = await HIDAsync.open(pluginInfo.device.path).catch((error: unknown) => {
			throw new Error(`Failed to open HID device ${pluginInfo.device.path}: ${String(error)}`, { cause: error })
		})

		logger.debug(`Opening ${pluginInfo.device.path} device: ${pluginInfo.model.productName} (${surfaceId})`)

		return {
			surface: new MiraboxWrapper(surfaceId, pluginInfo.device, device, pluginInfo.model, context),
			registerProps: {
				brightness: true,
				surfaceLayout: createSurfaceSchema(pluginInfo.model),
				pincodeMap: createPincodeMap(pluginInfo.model),
				configFields: createConfigFields(pluginInfo.model),
				location: null,
			},
		}
	},
}
export default MiraboxPlugin
