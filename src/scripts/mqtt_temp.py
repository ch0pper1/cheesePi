#!/usr/bin/python3

import time
import math
import Adafruit_ADS1x15
import paho.mqtt.client as mqtt

global mTemp, wTemp
MQTTv311 = 4

broker_address = "192.168.1.16"
client = mqtt.Client("publisher1")
client.connect(broker_address, 1883)

adc = Adafruit_ADS1x15.ADS1115()
resistor1 = 10000
resistor2 = 10000
resistor3 = 10000
# Input voltage
voltin = 5.18
# Resistance thermometer values from datasheet
bResistance = 3890
t25Resistance = 10000
# Constants
t0 = 273.15
t25 = t0 + 25.0

# Methods
def calcResistance(voltage):
	#print((resistor2*resistor3 + resistor3* (resistor1+resistor2)*voltage / voltin )/ (resistor1- (resistor1+resistor2)*voltage / voltin))
	return (resistor2*resistor3 + resistor3* (resistor1+resistor2)*voltage / voltin )/ (resistor1- (resistor1+resistor2)*voltage / voltin)

def calcTemp(resistance):
	return (1 / ( (math.log(resistance / t25Resistance) / bResistance) + (1 / t25) ) - t0)

def getTemp(port):
	GAIN = 1

	# read from adc channels and print to screen
	if port == 0: 
		bridgeVoltage =  adc.read_adc_difference(0, 1) * (4.096 / 32767.0)
	elif port == 2:
		bridgeVoltage =  adc.read_adc_difference(3, 1) * (4.096 / 32767.0)
	thermresistance = calcResistance(bridgeVoltage)
	temperature = calcTemp(thermresistance)
	temperatureF = round((9.0/5.0)*temperature + 32.0, 1)

	return temperatureF

while True:
	mTemp = getTemp(0) - 3.0
	wTemp = getTemp(2) - 4.0
	client.publish("temp/mTemp",mTemp)
	time.sleep(1)
	client.publish("temp/wTemp",wTemp)
	time.sleep(1)
