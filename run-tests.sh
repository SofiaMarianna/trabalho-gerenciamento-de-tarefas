#!/bin/bash
cd /home/fran_bernardo/GitHub/faculdade/trabalho-gerenciamento-de-tarefas

echo "==================== FULL TEST SUITE ===================="
npm test

echo ""
echo "==================== UNIT TESTS ONLY ===================="
npm run test:unit

echo ""
echo "==================== INTEGRATION TESTS ONLY ===================="
npm run test:integration

echo ""
echo "==================== SYSTEM TESTS ONLY ===================="
npm run test:system

echo ""
echo "==================== TEST RUN COMPLETE ===================="
