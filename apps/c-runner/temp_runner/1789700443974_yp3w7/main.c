// Write your C solution here
#include <stdio.h>

int main() {
int Id;
int hr;
int min;
int mul;
int sum;
  
  printf("Enter employee ID:");
  scanf("%s",&Id);
  printf("Enter hours worked:");
  scanf("%d",&hr);
  printf("Enter minutes worked:");
  scanf("%d",&min);

  mul = hr * 60;
  sum = mul + min ;
printf("---------------------------------------------------\n");
  printf("Employee %d",Id);
  printf(" Total Munites Worked %d:",sum);

}