import { useEffect, useState, type ReactNode } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'
import { GHANA_REGION_OPTIONS } from '../../utils/ghanaRegions'
import {
  LISTING_BALE_GRADES,
  LISTING_BRANDS,
  LISTING_CATEGORIES,
  LISTING_COLORS,
  LISTING_CONDITIONS,
  LISTING_FITS,
  LISTING_MATERIALS,
  LISTING_PATTERNS,
  categoryUsesField,
  optionLabel,
  sizeLabelForCategory,
  sizePlaceholderForCategory,
  subcategoriesForCategory,
} from '../../utils/listingTaxonomy'
import { Button } from '../ui/Button'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'

export type BrowseFilters = {
  baleGrade: string
  brand: string
  category: string
  color: string
  condition: string
  fit: string
  gender: string
  location: string
  material: string
  maxPrice: string
  minPrice: string
  pattern: string
  size: string
  subcategory: string
}

export const EMPTY_BROWSE_FILTERS: BrowseFilters = {
  baleGrade: '',
  brand: '',
  category: '',
  color: '',
  condition: '',
  fit: '',
  gender: '',
  location: '',
  material: '',
  maxPrice: '',
  minPrice: '',
  pattern: '',
  size: '',
  subcategory: '',
}

export function activeFilterCount(filters: BrowseFilters) {
  return Object.values(filters).filter(Boolean).length
}

// RN can't render CSS gradient strings as backgroundColor; these two swatches fall back to a flat
// approximation rather than pulling in expo-linear-gradient for two colors.
const SWATCH_FALLBACK: Record<string, string> = { multi: '#8a5cf6', silver: '#c0c0c0' }

const GENDER_OPTIONS: DropdownOption[] = ['men', 'women', 'unisex', 'kids'].map((value) => ({ label: optionLabel(value), value }))
const CATEGORY_OPTIONS: DropdownOption[] = LISTING_CATEGORIES.map((item) => ({ label: item.label, value: item.label }))
const LOCATION_OPTIONS: DropdownOption[] = GHANA_REGION_OPTIONS.map((option) => ({ label: option.label, value: option.value }))
const BRAND_OPTIONS: DropdownOption[] = LISTING_BRANDS.map((brand) => ({ label: brand, value: brand }))
const MATERIAL_OPTIONS: DropdownOption[] = LISTING_MATERIALS.map((value) => ({ label: optionLabel(value), value }))
const FIT_OPTIONS: DropdownOption[] = LISTING_FITS.map((value) => ({ label: optionLabel(value), value }))
const PATTERN_OPTIONS: DropdownOption[] = LISTING_PATTERNS.map((value) => ({ label: optionLabel(value), value }))
const BALE_GRADE_OPTIONS: DropdownOption[] = LISTING_BALE_GRADES.map((value) => ({ label: optionLabel(value), value }))
const CONDITION_OPTIONS: DropdownOption[] = LISTING_CONDITIONS.map((value) => ({ label: optionLabel(value), value }))

/**
 * Native port of `frontend/src/components/marketplace/MarketplaceFilters.tsx`'s mobile drawer.
 * Web slides a drawer in from the left; this follows the bottom-sheet idiom `Dropdown.tsx` already
 * established elsewhere in the app instead, since that's this codebase's native picker convention.
 */
export function MarketplaceFilterSheet({
  onApply,
  onClose,
  type,
  value,
  visible,
}: {
  onApply: (filters: BrowseFilters) => void
  onClose: () => void
  type: 'retail' | 'wholesale'
  value: BrowseFilters
  visible: boolean
}) {
  const colors = useThemeColors()
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!visible) return
    // Re-sync the draft to the last-applied filters each time the sheet opens, so a cancelled
    // edit never leaks into the next time it's opened.
    queueMicrotask(() => setDraft(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const show = (field: Parameters<typeof categoryUsesField>[1]) => categoryUsesField(draft.category, field, draft.subcategory, type)
  const subcategoryOptions: DropdownOption[] = subcategoriesForCategory(draft.category).map((label) => ({ label, value: label }))

  function set<Key extends keyof BrowseFilters>(key: Key, next: BrowseFilters[Key]) {
    setDraft((current) => ({ ...current, [key]: next }))
  }

  function clearAll() {
    setDraft(EMPTY_BROWSE_FILTERS)
  }

  function apply() {
    onApply(draft)
    onClose()
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="max-h-[88%] rounded-t-2xl bg-foose-surface" onPress={() => {}}>
          <View className="flex-row items-center justify-between border-b border-foose-border px-4 py-3.5">
            <Text className="text-lg font-black text-foose-text">Filters</Text>
            <Pressable accessibilityLabel="Clear all filters" accessibilityRole="button" onPress={clearAll}>
              <Text className="text-sm font-black text-accent">Clear all</Text>
            </Pressable>
          </View>

          <ScrollView className="px-4" contentContainerClassName="gap-4 py-4">
            <FilterField label="Category">
              <Dropdown
                onChange={(next) => setDraft((current) => ({ ...current, category: next, subcategory: '' }))}
                options={CATEGORY_OPTIONS}
                placeholder="All categories"
                value={draft.category}
              />
            </FilterField>

            {!!subcategoryOptions.length && (
              <FilterField label="Subcategory">
                <Dropdown
                  onChange={(next) => set('subcategory', next)}
                  options={subcategoryOptions}
                  placeholder={`All ${draft.category}`}
                  value={draft.subcategory}
                />
              </FilterField>
            )}

            <FilterField label="Location">
              <Dropdown onChange={(next) => set('location', next)} options={LOCATION_OPTIONS} placeholder="All locations" value={draft.location} />
            </FilterField>

            {show('brand') && (
              <FilterField label="Brand">
                <Dropdown onChange={(next) => set('brand', next)} options={BRAND_OPTIONS} placeholder="All brands" value={draft.brand} />
              </FilterField>
            )}

            {show('size') && (
              <FilterField label={sizeLabelForCategory(draft.category, draft.subcategory)}>
                <TextInput
                  className="h-12 rounded-xl border border-foose-border bg-foose-surface-low px-3.5 text-sm text-foose-text"
                  onChangeText={(next) => set('size', next)}
                  placeholder={sizePlaceholderForCategory(draft.category, draft.subcategory)}
                  placeholderTextColor={colors.faint}
                  value={draft.size}
                />
              </FilterField>
            )}

            {show('gender') && (
              <FilterField label="Gender">
                <Dropdown onChange={(next) => set('gender', next)} options={GENDER_OPTIONS} placeholder="All" value={draft.gender} />
              </FilterField>
            )}

            {show('material') && (
              <FilterField label="Material">
                <Dropdown onChange={(next) => set('material', next)} options={MATERIAL_OPTIONS} placeholder="All materials" value={draft.material} />
              </FilterField>
            )}

            {show('fit') && (
              <FilterField label="Fit">
                <Dropdown onChange={(next) => set('fit', next)} options={FIT_OPTIONS} placeholder="All fits" value={draft.fit} />
              </FilterField>
            )}

            {show('pattern') && (
              <FilterField label="Pattern">
                <Dropdown onChange={(next) => set('pattern', next)} options={PATTERN_OPTIONS} placeholder="All patterns" value={draft.pattern} />
              </FilterField>
            )}

            {show('baleGrade') && (
              <FilterField label="Bale grade">
                <Dropdown onChange={(next) => set('baleGrade', next)} options={BALE_GRADE_OPTIONS} placeholder="All grades" value={draft.baleGrade} />
              </FilterField>
            )}

            <FilterField label="Condition">
              <Dropdown onChange={(next) => set('condition', next)} options={CONDITION_OPTIONS} placeholder="All conditions" value={draft.condition} />
            </FilterField>

            <FilterField label="Color">
              <View className="flex-row flex-wrap gap-2.5">
                {LISTING_COLORS.map((color) => {
                  const active = draft.color === color.value
                  return (
                    <Pressable
                      accessibilityLabel={color.label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={color.value}
                      onPress={() => set('color', active ? '' : color.value)}
                    >
                      <View
                        className={`size-9 rounded-full border-2 ${active ? 'border-accent' : 'border-foose-border'}`}
                        style={{ backgroundColor: SWATCH_FALLBACK[color.value] || color.hex }}
                      />
                    </Pressable>
                  )
                })}
              </View>
              {!!draft.color && <Text className="text-xs font-semibold text-foose-muted">{LISTING_COLORS.find((c) => c.value === draft.color)?.label}</Text>}
            </FilterField>

            <FilterField label="Price (GHS)">
              <View className="flex-row gap-2.5">
                <TextInput
                  className="h-12 flex-1 rounded-xl border border-foose-border bg-foose-surface-low px-3.5 text-sm text-foose-text"
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  onChangeText={(next) => set('minPrice', next)}
                  placeholder="No min"
                  placeholderTextColor={colors.faint}
                  value={draft.minPrice}
                />
                <TextInput
                  className="h-12 flex-1 rounded-xl border border-foose-border bg-foose-surface-low px-3.5 text-sm text-foose-text"
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  onChangeText={(next) => set('maxPrice', next)}
                  placeholder="No max"
                  placeholderTextColor={colors.faint}
                  value={draft.maxPrice}
                />
              </View>
            </FilterField>
          </ScrollView>

          <View className="border-t border-foose-border p-4">
            <Button full label="Apply filters" onPress={apply} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function FilterField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-bold uppercase tracking-wide text-foose-muted">{label}</Text>
      {children}
    </View>
  )
}
