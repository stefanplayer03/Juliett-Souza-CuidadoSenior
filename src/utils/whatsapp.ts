export interface WhatsAppReminderData {
  phone?: string;
  patientName: string;
  medicationName?: string;
  dosage?: string;
  scheduledTime?: string;
  timingInstruction?: string;
  appointmentTitle?: string;
  appointmentType?: 'consulta' | 'exame';
  doctorOrClinic?: string;
  dateTime?: string;
  prepInstructions?: string;
}

export interface WhatsAppCuratorAlertData {
  phone?: string;
  curatorName?: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  scheduledDate: string;
  status: 'delayed' | 'missed';
  reason?: string;
}

export interface DailyReportItem {
  time: string;
  medicationName: string;
  dosage: string;
  status: string;
  administeredBy?: string;
  responsibleRole?: string;
  administeredAt?: string;
  reasonNotAdministered?: string;
}

export interface WhatsAppDailyReportData {
  phone?: string;
  curatorName?: string;
  patientName: string;
  dateStr: string;
  items: DailyReportItem[];
}

export const formatWhatsAppPhone = (phone: string): string => {
  // Clean phone number to keep digits only
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  // If no country code, prepend 55 (Brazil)
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }
  return cleaned;
};

export const openWhatsAppMedicationReminder = (
  phone: string,
  data: WhatsAppReminderData
) => {
  const formattedPhone = formatWhatsAppPhone(phone);
  const text = `🚨 *CUIDADO SÊNIOR - ALERTA DE MEDICAÇÃO* 🚨\n\n*Paciente:* ${data.patientName}\n*Medicamento:* ${data.medicationName}\n*Dosagem:* ${data.dosage}\n*Horário Programado:* ${data.scheduledTime}\n*Instrução:* ${data.timingInstruction || 'Indiferente'}\n\n⚠️ *Por favor, confirme a administração no aplicativo assim que ministrado!*`;
  
  const encoded = encodeURIComponent(text);
  const url = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
};

export const openWhatsAppAppointmentReminder = (
  phone: string,
  data: WhatsAppReminderData
) => {
  const formattedPhone = formatWhatsAppPhone(phone);
  const typeLabel = data.appointmentType === 'exame' ? 'EXAME MÉDICO' : 'CONSULTA MÉDICA';
  const text = `🗓️ *CUIDADO SÊNIOR - LEMBRETE DE ${typeLabel}* 🗓️\n\n*Paciente:* ${data.patientName}\n*Compromisso:* ${data.appointmentTitle}\n*Local / Médico:* ${data.doctorOrClinic}\n*Data e Horário:* ${data.dateTime}\n${
    data.prepInstructions ? `*Preparo do Exame:* ⚠️ ${data.prepInstructions}\n` : ''
  }\n⚠️ *Lembrete enviado com antecedência para acompanhamento do paciente.*`;

  const encoded = encodeURIComponent(text);
  const url = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
};

export const openWhatsAppCuratorAlert = (
  phone: string,
  data: WhatsAppCuratorAlertData
) => {
  const formattedPhone = formatWhatsAppPhone(phone);
  const statusLabel = data.status === 'missed' ? 'NÃO ADMINISTRADO / ESQUECIDO' : 'ATRASADO';
  const text = `🚨 *NOTIFICAÇÃO URGENTE AO CURADOR / FAMILIAR* 🚨\n\n*Paciente:* ${data.patientName}\n*Status:* ⚠️ ${statusLabel}\n*Medicamento:* ${data.medicationName} (${data.dosage})\n*Data/Horário:* ${data.scheduledDate} às ${data.scheduledTime}${
    data.reason ? `\n*Motivo Informado:* ${data.reason}` : ''
  }\n\n*Atenção:* Favor verificar a situação da medicação com a equipe de cuidados ou paciente imediatamente.`;

  const encoded = encodeURIComponent(text);
  const url = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
};

export const openWhatsAppDailyReport = (
  phone: string,
  data: WhatsAppDailyReportData
) => {
  const formattedPhone = formatWhatsAppPhone(phone);
  const formattedDate = new Date(data.dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const total = data.items.length;
  const taken = data.items.filter((i) => i.status === 'administered').length;
  const missed = data.items.filter((i) => i.status === 'missed').length;
  const pending = data.items.filter((i) => i.status === 'pending' || i.status === 'delayed').length;

  let reportText = `📋 *RELATÓRIO DIÁRIO DE MEDICAMENTOS - CUIDADO SÊNIOR* 📋\n`;
  reportText += `👤 *Paciente:* ${data.patientName}\n`;
  reportText += `📅 *Data:* ${formattedDate}\n`;
  reportText += `📊 *Resumo:* ${taken}/${total} administrados | ${missed} esquecidos | ${pending} pendentes\n\n`;
  reportText += `*DETALHAMENTO DAS DOSES:*\n`;

  data.items.forEach((item, index) => {
    const statusEmoji =
      item.status === 'administered' ? '✅' : item.status === 'missed' ? '❌' : '⏰';
    const statusName =
      item.status === 'administered'
        ? 'Administrado'
        : item.status === 'missed'
        ? 'NÃO Administrado'
        : 'Pendente/Atrasado';

    reportText += `\n${index + 1}. ${statusEmoji} *${item.time}* - ${item.medicationName} (${item.dosage})\n`;
    reportText += `   • Status: ${statusName}\n`;
    if (item.status === 'administered') {
      reportText += `   • Aplicado por: ${item.administeredBy || 'Não especificado'} (${item.responsibleRole || 'Cuidador'})\n`;
      if (item.administeredAt) {
        reportText += `   • Horário real: ${item.administeredAt}\n`;
      }
    } else if (item.status === 'missed' && item.reasonNotAdministered) {
      reportText += `   • Motivo: ${item.reasonNotAdministered}\n`;
    }
  });

  reportText += `\n\n💬 *Relatório gerado automaticamente pelo Sistema Cuidado Sênior.*`;

  const encoded = encodeURIComponent(reportText);
  const url = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
};

