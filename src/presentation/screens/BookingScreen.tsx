import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { displayDate } from '../../domain/availability';
import { Empty, Header, Loading, money, Summary } from '../components/ui';
import { colors, styles } from '../theme/styles';
import { BookingViewModel } from '../viewmodels/useBookingViewModel';

export function BookingScreen({ vm, onConfirm }: { vm: BookingViewModel; onConfirm: () => void }) {
  return (
    <>
      <Header eyebrow={vm.editingAppointment ? 'REPROGRAMAR CITA' : 'RESERVAR CITA'} title={vm.service.name} />
      <Text style={styles.subtitle}>{vm.service.duration} min · {money(vm.service.price)}</Text>
      <Text style={styles.step}>1. SUCURSAL</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {vm.branches.map((branch) => <Pressable key={branch.id} onPress={() => vm.setSelectedBranchId(branch.id)} style={[styles.optionChip, vm.selectedBranchId === branch.id && styles.optionChipSelected]}><Text style={[styles.optionMain, vm.selectedBranchId === branch.id && styles.optionMainSelected]}>{branch.name}</Text><Text style={[styles.optionSub, vm.selectedBranchId === branch.id && styles.optionSubSelected]} numberOfLines={1}>{branch.detail}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.step}>2. BARBERO</Text>
      {vm.loadingData && !vm.barbers.length ? <Loading label="Consultando barberos..." /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {vm.barbers.map((barber) => <Pressable key={barber.id} onPress={() => vm.setSelectedBarberId(barber.id)} style={[styles.optionChip, vm.selectedBarberId === barber.id && styles.optionChipSelected]}><Text style={[styles.optionMain, vm.selectedBarberId === barber.id && styles.optionMainSelected]}>{barber.name}</Text><Text style={[styles.optionSub, vm.selectedBarberId === barber.id && styles.optionSubSelected]}>{barber.specialty}</Text></Pressable>)}
      </ScrollView>}
      <Text style={styles.step}>3. ELIGE EL DIA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {vm.dates.map((date) => <Pressable key={date.key} disabled={!date.available} onPress={() => vm.setSelectedDate(date.key)} style={[styles.dateCard, !date.available && styles.dateCardBusy, vm.selectedDate === date.key && styles.dateCardSelected]}><Text style={[styles.dateText, !date.available && styles.slotBusyText, vm.selectedDate === date.key && styles.dateTextSelected]}>{date.label}</Text></Pressable>)}
      </ScrollView>
      <Text style={styles.step}>4. HORARIO DISPONIBLE</Text>
      {vm.loadingData && !vm.slots.length ? <Loading label="Consultando disponibilidad..." /> : <View style={styles.slotGrid}>
        {vm.slots.map((slot) => <Pressable key={slot.time} disabled={!slot.available} onPress={() => vm.setSelectedTime(slot.time)} style={[styles.slot, !slot.available && styles.slotBusy, vm.selectedTime === slot.time && styles.slotSelected]}><Text style={[styles.slotText, !slot.available && styles.slotBusyText, vm.selectedTime === slot.time && styles.slotTextSelected]}>{slot.available ? slot.time : 'Ocupado'}</Text></Pressable>)}
      </View>}
      {!vm.slots.length && !vm.loadingData ? <Empty label={vm.message} /> : <Text style={styles.helperText}>{vm.message}</Text>}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumen</Text>
        <Summary label="Servicio" value={vm.service.name} />
        <Summary label="Sucursal" value={vm.currentBranch?.name || 'Sin seleccionar'} />
        <Summary label="Barbero" value={vm.currentBarber?.name || 'Sin seleccionar'} />
        <Summary label="Fecha" value={displayDate(vm.selectedDate)} />
        <Summary label="Horario" value={vm.selectedTime || 'Sin seleccionar'} />
      </View>
      <Pressable disabled={vm.saving} onPress={onConfirm} style={[styles.goldButton, vm.saving && styles.disabled]}>{vm.saving ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.goldButtonText}>{vm.editingAppointment ? 'Guardar nuevo horario' : 'Confirmar cita'}</Text>}</Pressable>
    </>
  );
}
