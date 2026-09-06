#!/usr/bin/env python3
"""Add quote.noBasePriceNotice i18n key to remaining 6 language files."""
from pathlib import Path

TRANSLATIONS = {
    'pt-br.ts': 'Este serviço não tem preço base publicado. Por favor descreva seus requisitos e nossa equipe fornecerá um orçamento personalizado.',
    'es-es.ts': 'Este servicio no tiene un precio base publicado. Por favor describa sus requisitos y nuestro equipo le proporcionará un presupuesto personalizado.',
    'fr-fr.ts': "Ce service n'a pas de prix de base publié. Veuillez décrire vos besoins et notre équipe vous fournira un devis personnalisé.",
    'de-de.ts': 'Dieser Dienst hat keinen veröffentlichten Basispreis. Bitte beschreiben Sie Ihre Anforderungen und unser Team erstellt Ihnen ein individuelles Angebot.',
    'sw-tz.ts': 'Huduma hii hana bei ya msingi iliyochapishwa. Tafadhali eleza mahitaji yako na timu yetu itakupa nukuu maalum.',
    'zh-cn.ts': '此服务没有公布的基础价格。请描述您的需求，我们的团队将为您提供定制报价。',
}

BASE = Path('/home/z/my-project/src/lib/translations')

for fname, val in TRANSLATIONS.items():
    p = BASE / fname
    content = p.read_text(encoding='utf-8')
    # Search for the existing priceNotice line and add noBasePriceNotice after it.
    # The priceNotice line looks like: "    priceNotice: '...',"  followed by "    basePrice: '...',"
    needle = "    priceNotice:"
    idx = content.find(needle)
    if idx == -1:
        print(f'WARN: priceNotice not found in {fname}')
        continue
    # Find end of line (newline)
    line_end = content.find('\n', idx)
    if line_end == -1:
        print(f'WARN: no newline after priceNotice in {fname}')
        continue
    # Escape single quotes
    val_escaped = val.replace('\\', '\\\\').replace("'", "\\'")
    new_line = f"\n    noBasePriceNotice: '{val_escaped}',"
    # Insert after the priceNotice line
    new_content = content[:line_end] + new_line + content[line_end:]
    p.write_text(new_content, encoding='utf-8')
    print(f'OK: {fname}')

print('Done.')
