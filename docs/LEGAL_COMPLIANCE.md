# LEGAL COMPLIANCE — FONTES OFICIAIS E DIRETRIZES DE CONFORMIDADE

O módulo de conformidade jurídica do **SaaS Validation Lab** foi desenhado com rigor metodológico, operando exclusivamente com base em fontes oficiais rastreáveis.

---

## 1. Fontes Normativas Oficiais

### 1.1 Lei Geral de Proteção de Dados Pessoais (LGPD) — Lei nº 13.709/2018
- **Fonte Oficial**: [Planalto Compilado](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm)
- **Escopo**: Tratamento de dados pessoais, inclusive nos meios digitais, por pessoa natural ou por pessoa jurídica de direito público ou privado, com o objetivo de proteger os direitos fundamentais de liberdade e de privacidade.
- **Principais Controles Técnicos Auditados**:
  - Art. 6º: Princípios da finalidade, adequação, necessidade, livre acesso, qualidade dos dados, transparência e segurança.
  - Art. 7º: Bases legais documentadas (consentimento, cumprimento de obrigação legal, execução de contrato, legítimo interesse).
  - Art. 11: Dados pessoais sensíveis (saúde, biometria, etc.) com exigência de salvaguardas adicionais.
  - Art. 18: Direitos dos titulares (confirmação de existência, acesso, correção, eliminação).
  - Art. 46 a 49: Medidas de segurança técnicas e administrativas (criptografia, controle de acesso).

### 1.2 Lei nº 13.787/2018 (Prontuário Eletrônico de Pacientes)
- **Fonte Oficial**: [Planalto - Lei 13.787/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13787.htm)
- **Regra de Aplicabilidade**: **Somente aplicável** quando o SaaS envolver digitalização, guarda, armazenamento ou manuseio de prontuários de pacientes. Se o produto não tratar prontuários médicos, esta lei é classificada como `NOT_APPLICABLE_WITH_JUSTIFICATION`.

### 1.3 Marco Civil da Internet — Lei nº 12.965/2014
- **Fonte Oficial**: [Planalto - Lei 12.965/2014](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm)
- **Escopo**: Guarda de registros de conexão e de acesso a aplicações de internet (Art. 13 e 15), neutralidade e privacidade de comunicações.

---

## 2. Metodologia de Classificação dos Requisitos

Cada requisito avaliado recebe um dos seguintes estados:
- `APPLICABLE`: O SaaS trata dados ou opera em contexto expressamente coberto pela norma.
- `POTENTIALLY_APPLICABLE`: Há fortes indícios de incidência, dependendo do modelo de negócio ou tipos de dados opcionais.
- `NOT_APPLICABLE_WITH_JUSTIFICATION`: Não aplicável, com justificativa técnica formal registrada.
- `NEEDS_LEGAL_REVIEW`: Questão complexa que demanda parecer formal de profissional de Direito.

> [!WARNING]
> O SaaS Validation Lab realiza auditoria técnica preliminar de requisitos de privacidade. Seus relatórios têm caráter técnico e não substituem consulta a advogado ou encarregado de dados (DPO).
